import parseAcct from '../acct/parse';
import Post, { pack } from '../models/post';
import User, { isLocalUser, isRemoteUser, IUser } from '../models/user';
import stream from '../publishers/stream';
import Following from '../models/following';
import { createHttp } from '../queue';
import renderNote from '../remote/activitypub/renderer/note';
import renderCreate from '../remote/activitypub/renderer/create';
import context from '../remote/activitypub/renderer/context';

export default async (user: IUser, post, reply, repost, atMentions) => {
	post.mentions = [];

	function addMention(mentionee) {
		// Reject if already added
		if (post.mentions.some(x => x.equals(mentionee))) return;

		// Add mention
		post.mentions.push(mentionee);
	}

	if (reply) {
		// Add mention
		addMention(reply.userId);
		post.replyId = reply._id;
		post._reply = { userId: reply.userId };
	} else {
		post.replyId = null;
		post._reply = null;
	}

	if (repost) {
		if (post.text) {
			// Add mention
			addMention(repost.userId);
		}

		post.repostId = repost._id;
		post._repost = { userId: repost.userId };
	} else {
		post.repostId = null;
		post._repost = null;
	}

	await Promise.all(atMentions.map(async mention => {
		// Fetch mentioned user
		// SELECT _id
		const { _id } = await User
			.findOne(parseAcct(mention), { _id: true });

		// Add mention
		addMention(_id);
	}));

	const inserted = await Post.insert(post);

	User.update({ _id: user._id }, {
		// Increment my posts count
		$inc: {
			postsCount: 1
		},

		$set: {
			latestPost: post._id
		}
	});

	const postObj = await pack(inserted);

	// タイムラインへの投稿
	if (!post.channelId) {
		// Publish event to myself's stream
		stream(post.userId, 'post', postObj);

		// Fetch all followers
		const followers = await Following.aggregate([{
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
		});

		const note = await renderNote(user, post);
		const content = renderCreate(note);
		content['@context'] = context;

		Promise.all(followers.map(({ follower }) => {
			if (isLocalUser(follower)) {
				// Publish event to followers stream
				stream(follower._id, 'post', postObj);
			} else {
				// フォロワーがリモートユーザーかつ投稿者がローカルユーザーなら投稿を配信
				if (isLocalUser(user)) {
					createHttp({
						type: 'deliver',
						user,
						content,
						to: follower.account.inbox
					}).save();
				}
			}
		}));
	}

	// チャンネルへの投稿
	/* TODO
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
	}*/

	return Promise.all(promises);

};
