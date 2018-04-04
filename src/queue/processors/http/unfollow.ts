import FollowedLog from '../../../models/followed-log';
import Following from '../../../models/following';
import FollowingLog from '../../../models/following-log';
import User, { isLocalUser, isRemoteUser, pack as packUser } from '../../../models/user';
import stream from '../../../publishers/stream';
import renderFollow from '../../../remote/activitypub/renderer/follow';
import renderUndo from '../../../remote/activitypub/renderer/undo';
import context from '../../../remote/activitypub/renderer/context';
import request from '../../../remote/request';

export default async ({ data }, done) => {
	const following = await Following.findOne({ _id: data.id });
	if (following === null) {
		done();
		return;
	}

	let follower;
	let followee;

	try {
		[follower, followee] = await Promise.all([
			User.findOne({ _id: following.followerId }),
			User.findOne({ _id: following.followeeId })
		]);

		if (isLocalUser(follower) && isRemoteUser(followee)) {
			const undo = renderUndo(renderFollow(follower, followee));
			undo['@context'] = context;

			await request(follower, followee.account.inbox, undo);
		}
	} catch (error) {
		done(error);
		return;
	}

	try {
		await Promise.all([
			// Delete following
			Following.findOneAndDelete({ _id: data.id }),

			// Decrement following count
			User.update({ _id: follower._id }, { $inc: { followingCount: -1 } }),
			FollowingLog.insert({
				createdAt: new Date(),
				userId: follower._id,
				count: follower.followingCount - 1
			}),

			// Decrement followers count
			User.update({ _id: followee._id }, { $inc: { followersCount: -1 } }),
			FollowedLog.insert({
				createdAt: new Date(),
				userId: followee._id,
				count: followee.followersCount - 1
			})
		]);

		if (isLocalUser(follower)) {
			return;
		}

		const promisedPackedUser = packUser(followee, follower);

		// Publish follow event
		stream(follower._id, 'unfollow', promisedPackedUser);
	} finally {
		done();
	}
};
