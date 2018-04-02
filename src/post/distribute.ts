import Channel from '../models/channel';
import Mute from '../models/mute';
import Following from '../models/following';
import Post from '../models/post';
import Watching from '../models/post-watching';
import ChannelWatching from '../models/channel-watching';
import User from '../models/user';
import stream, { publishChannelStream } from '../publishers/stream';
import notify from '../publishers/notify';
import pushSw from '../publishers/push-sw';
import watch from './watch';

export default async (user, mentions, post) => {
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

	function addMention(mentionee, reason) {
		// Publish event
		if (!user._id.equals(mentionee)) {
			promises.push(Mute.find({
				muterId: mentionee,
				deletedAt: { $exists: false }
			}).then(mentioneeMutes => {
				const mentioneesMutedUserIds = mentioneeMutes.map(m => m.muteeId.toString());
				if (mentioneesMutedUserIds.indexOf(user._id.toString()) == -1) {
					stream(mentionee, reason, post);
					pushSw(mentionee, reason, post);
				}
			}));
		}
	}

	// タイムラインへの投稿
	if (!post.channelId) {
		// Publish event to myself's stream
		stream(user._id, 'post', post);

		// Fetch all followers
		const followers = await Following
			.find({
				followeeId: user._id,
				// 削除されたドキュメントは除く
				deletedAt: { $exists: false }
			}, {
				followerId: true,
				_id: false
			});

		// Publish event to followers stream
		followers.forEach(following =>
			stream(following.followerId, 'post', post));
	}

	// チャンネルへの投稿
	if (post.channelId) {
		// Increment channel index(posts count)
		promises.push(Channel.update({ _id: post.channelId }, {
			$inc: {
				index: 1
			}
		}));

		// Publish event to channel
		publishChannelStream(post.channelId, 'post', post);

		// Get channel watchers
		const watches = await ChannelWatching.find({
			channelId: post.channelId,
			// 削除されたドキュメントは除く
			deletedAt: { $exists: false }
		});

		// チャンネルの視聴者(のタイムライン)に配信
		watches.forEach(w => {
			stream(w.userId, 'post', post);
		});
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
			notify(post.reply.userId, user._id, 'reply', {
				postId: post._id
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
		addMention(post.reply.userId, 'reply');

		// この投稿をWatchする
		if (user.account.settings.autoWatch !== false) {
			promises.push(watch(user._id, post.reply));
		}
	}

	// If it is repost
	if (post.repostId) {
		const type = post.text ? 'quote' : 'repost';

		promises.push(
			// Notify
			notify(post.repost.userId, user._id, type, {
				postId: post._id
			}),

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
				}),

			// この投稿をWatchする
			// TODO: ユーザーが「Repostしたときに自動でWatchする」設定を
			//       オフにしていた場合はしない
			watch(user._id, post.repost)
		);

		// If it is quote repost
		if (post.text) {
			// Add mention
			addMention(post.repost.userId, 'quote');
		} else {
			// Publish event
			if (!user._id.equals(post.repost.userId)) {
				stream(post.repost.userId, 'repost', post);
			}
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
	await Promise.all(mentions.map(async mention => {
		// 既に言及されたユーザーに対する返信や引用repostの場合も無視
		if (post.reply && post.reply.userId.equals(mention)) return;
		if (post.repost && post.repost.userId.equals(mention)) return;

		// Add mention
		addMention(mention, 'mention');

		// Create notification
		await notify(mention, user._id, 'mention', {
			postId: post._id
		});
	}));

	return Promise.all(promises);
};
