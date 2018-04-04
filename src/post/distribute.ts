import Channel from '../models/channel';
import ChannelWatching from '../models/channel-watching';
import Following from '../models/following';
import Mute from '../models/mute';
import Post, { pack } from '../models/post';
import Watching from '../models/post-watching';
import User, { isLocalUser } from '../models/user';
import stream, { publishChannelStream } from '../publishers/stream';
import notify from '../publishers/notify';
import pushSw from '../publishers/push-sw';
import queue from '../queue';
import watch from './watch';

export default async (user, mentions, post) => {
	const promisedPostObj = pack(post);
	const promises = [
		User.update({ _id: user._id }, {
			// Increment my posts count
			$inc: {
				postsCount: 1
			},

			$set: {
				latestPost: post._id
			}
		}),
	] as Array<Promise<any>>;

	function addMention(promisedMentionee, reason) {
		// Publish event
		promises.push(promisedMentionee.then(mentionee => {
			if (user._id.equals(mentionee)) {
				return Promise.resolve();
			}

			return Promise.all([
				promisedPostObj,
				Mute.find({
					muterId: mentionee,
					deletedAt: { $exists: false }
				})
			]).then(([postObj, mentioneeMutes]) => {
				const mentioneesMutedUserIds = mentioneeMutes.map(m => m.muteeId.toString());
				if (mentioneesMutedUserIds.indexOf(user._id.toString()) == -1) {
					stream(mentionee, reason, postObj);
					pushSw(mentionee, reason, postObj);
				}
			});
		}));
	}

	// タイムラインへの投稿
	if (!post.channelId) {
		promises.push(
			// Publish event to myself's stream
			promisedPostObj.then(postObj => {
				stream(post.userId, 'post', postObj);
			}),

			Promise.all([
				User.findOne({ _id: post.userId }),

				// Fetch all followers
				Following.aggregate([{
					$lookup: {
						from: 'users',
						localField: 'followerId',
						foreignField: '_id',
						as: 'follower'
					}
				}, {
					$match: {
						followeeId: post.userId
					}
				}], {
					_id: false
				})
			]).then(([user, followers]) => Promise.all(followers.map(following => {
				if (isLocalUser(following.follower)) {
					// Publish event to followers stream
					return promisedPostObj.then(postObj => {
						stream(following.followerId, 'post', postObj);
					});
				}

				return new Promise((resolve, reject) => {
					queue.create('http', {
						type: 'deliverPost',
						fromId: user._id,
						toId: following.followerId,
						postId: post._id
					}).save(error => {
						if (error) {
							reject(error);
						} else {
							resolve();
						}
					});
				});
			})))
		);
	}

	// チャンネルへの投稿
	if (post.channelId) {
		promises.push(
			// Increment channel index(posts count)
			Channel.update({ _id: post.channelId }, {
				$inc: {
					index: 1
				}
			}),

			// Publish event to channel
			promisedPostObj.then(postObj => {
				publishChannelStream(post.channelId, 'post', postObj);
			}),

			Promise.all([
				promisedPostObj,

				// Get channel watchers
				ChannelWatching.find({
					channelId: post.channelId,
					// 削除されたドキュメントは除く
					deletedAt: { $exists: false }
				})
			]).then(([postObj, watches]) => {
				// チャンネルの視聴者(のタイムライン)に配信
				watches.forEach(w => {
					stream(w.userId, 'post', postObj);
				});
			})
		);
	}

	// If has in reply to post
	if (post.replyId) {
		promises.push(
			// Increment replies count
			Post.update({ _id: post.replyId }, {
				$inc: {
					repliesCount: 1
				}
			}),

			// 自分自身へのリプライでない限りは通知を作成
			promisedPostObj.then(({ reply }) => {
				return notify(reply.userId, user._id, 'reply', {
					postId: post._id
				});
			}),

			// Fetch watchers
			Watching
				.find({
					postId: post.replyId,
					userId: { $ne: user._id },
					// 削除されたドキュメントは除く
					deletedAt: { $exists: false }
				}, {
					fields: {
						userId: true
					}
				})
				.then(watchers => {
					watchers.forEach(watcher => {
						notify(watcher.userId, user._id, 'reply', {
							postId: post._id
						});
					});
				})
		);

		// Add mention
		addMention(promisedPostObj.then(({ reply }) => reply.userId), 'reply');

		// この投稿をWatchする
		if (user.account.settings.autoWatch !== false) {
			promises.push(promisedPostObj.then(({ reply }) => {
				return watch(user._id, reply);
			}));
		}
	}

	// If it is repost
	if (post.repostId) {
		const type = post.text ? 'quote' : 'repost';

		promises.push(
			promisedPostObj.then(({ repost }) => Promise.all([
				// Notify
				notify(repost.userId, user._id, type, {
					postId: post._id
				}),

				// この投稿をWatchする
				// TODO: ユーザーが「Repostしたときに自動でWatchする」設定を
				//       オフにしていた場合はしない
				watch(user._id, repost)
			])),

			// Fetch watchers
			Watching
				.find({
					postId: post.repostId,
					userId: { $ne: user._id },
					// 削除されたドキュメントは除く
					deletedAt: { $exists: false }
				}, {
					fields: {
						userId: true
					}
				})
				.then(watchers => {
					watchers.forEach(watcher => {
						notify(watcher.userId, user._id, type, {
							postId: post._id
						});
					});
				})
		);

		// If it is quote repost
		if (post.text) {
			// Add mention
			addMention(promisedPostObj.then(({ repost }) => repost.userId), 'quote');
		} else {
			promises.push(promisedPostObj.then(postObj => {
				// Publish event
				if (!user._id.equals(postObj.repost.userId)) {
					stream(postObj.repost.userId, 'repost', postObj);
				}
			}));
		}

		// 今までで同じ投稿をRepostしているか
		const existRepost = await Post.findOne({
			userId: user._id,
			repostId: post.repostId,
			_id: {
				$ne: post._id
			}
		});

		if (!existRepost) {
			// Update repostee status
			promises.push(Post.update({ _id: post.repostId }, {
				$inc: {
					repostCount: 1
				}
			}));
		}
	}

	// Resolve all mentions
	await promisedPostObj.then(({ reply, repost }) => Promise.all(mentions.map(async mention => {
		// 既に言及されたユーザーに対する返信や引用repostの場合も無視
		if (reply && reply.userId.equals(mention)) return;
		if (repost && repost.userId.equals(mention)) return;

		// Add mention
		addMention(mention, 'mention');

		// Create notification
		await notify(mention, user._id, 'mention', {
			postId: post._id
		});
	})));

	await Promise.all(promises);

	return promisedPostObj;
};
