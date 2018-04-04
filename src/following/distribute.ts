import User, { pack as packUser } from '../models/user';
import FollowingLog from '../models/following-log';
import FollowedLog from '../models/followed-log';
import event from '../publishers/stream';
import notify from '../publishers/notify';

export default async (follower, followee) => Promise.all([
	// Increment following count
	User.update(follower._id, {
		$inc: {
			followingCount: 1
		}
	}),

	FollowingLog.insert({
		createdAt: new Date(),
		userId: followee._id,
		count: follower.followingCount + 1
	}),

	// Increment followers count
	User.update({ _id: followee._id }, {
		$inc: {
			followersCount: 1
		}
	}),

	FollowedLog.insert({
		createdAt: new Date(),
		userId: follower._id,
		count: followee.followersCount + 1
	}),

	followee.host === null && Promise.all([
		// Notify
		notify(followee.id, follower.id, 'follow'),

		// Publish follow event
		packUser(follower, followee)
			.then(packed => event(followee._id, 'followed', packed))
	])
]);
