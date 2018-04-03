import Channel from '../../models/channel';
import Following from '../../models/following';
import ChannelWatching from '../../models/channel-watching';
import Post, { pack } from '../../models/post';
import User, { isLocalUser } from '../../models/user';
import stream, { publishChannelStream } from '../../publishers/stream';
import context from '../../remote/activitypub/renderer/context';
import renderCreate from '../../remote/activitypub/renderer/create';
import renderNote from '../../remote/activitypub/renderer/note';
import request from '../../remote/request';

export default ({ data }) => Post.findOne({ _id: data.id }).then(post => {
	const promisedPostObj = pack(post);
	const promises = [];

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
				Following.aggregate([
					{
						$lookup: {
							from: 'users',
							localField: 'followerId',
							foreignField: '_id',
							as: 'follower'
						}
					},
					{
					$match: {
							followeeId: post.userId
						}
					}
				], {
					_id: false
				})
			]).then(([user, followers]) => Promise.all(followers.map(following => {
				if (isLocalUser(following.follower)) {
					// Publish event to followers stream
					return promisedPostObj.then(postObj => {
						stream(following.followerId, 'post', postObj);
					});
				}

				return renderNote(user, post).then(note => {
					const create = renderCreate(note);
					create['@context'] = context;
					return request(user, following.follower[0].account.inbox, create);
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

	return Promise.all(promises);
});
