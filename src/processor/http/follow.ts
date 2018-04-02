import User, { isLocalUser, pack as packUser } from '../../models/user';
import Following from '../../models/following';
import FollowingLog from '../../models/following-log';
import FollowedLog from '../../models/followed-log';
import event from '../../publishers/stream';
import notify from '../../publishers/notify';
import context from '../../remote/activitypub/renderer/context';
import render from '../../remote/activitypub/renderer/follow';
import request from '../../remote/request';

export default ({ data }) => Following.findOne({ _id: data.following }).then(({ followerId, followeeId }) => {
	const promisedFollower = User.findOne({ _id: followerId });
	const promisedFollowee = User.findOne({ _id: followeeId });

	return Promise.all([
		// Increment following count
		User.update(followerId, {
			$inc: {
				followingCount: 1
			}
		}),

		promisedFollower.then(({ followingCount }) => FollowingLog.insert({
			createdAt: data.following.createdAt,
			userId: followerId,
			count: followingCount + 1
		})),

		// Increment followers count
		User.update({ _id: followeeId }, {
			$inc: {
				followersCount: 1
			}
		}),

		promisedFollowee.then(({ followersCount }) => FollowedLog.insert({
			createdAt: data.following.createdAt,
			userId: followerId,
			count: followersCount + 1
		})),

		// Notify
		promisedFollowee.then(followee => followee.host === null ?
			notify(followeeId, followerId, 'follow') : null),

		// Publish follow event
		Promise.all([promisedFollower, promisedFollowee]).then(([follower, followee]) => {
			let followerEvent;
			let followeeEvent;

			if (isLocalUser(follower)) {
				followerEvent = packUser(followee, follower)
					.then(packed => event(follower._id, 'follow', packed));
			}

			if (isLocalUser(followee)) {
				followeeEvent = packUser(follower, followee)
					.then(packed => event(followee._id, 'followed', packed));
			} else if (isLocalUser(follower)) {
				const rendered = render(follower, followee);
				rendered['@context'] = context;

				followeeEvent = request(follower, followee.account.inbox, rendered);
			}

			return Promise.all([followerEvent, followeeEvent]);
		})
	]);
});
