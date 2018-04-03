import FollowedLog from '../../models/followed-log';
import Following from '../../models/following';
import FollowingLog from '../../models/following-log';
import User, { isRemoteUser, pack as packUser } from '../../models/user';
import stream from '../../publishers/stream';
import renderFollow from '../../remote/activitypub/renderer/follow';
import renderUndo from '../../remote/activitypub/renderer/undo';
import context from '../../remote/activitypub/renderer/context';
import request from '../../remote/request';

export default async ({ data }) => {
	// Delete following
	const following = await Following.findOneAndDelete({ _id: data.id });
	if (following === null) {
		return;
	}

	const promisedFollower = User.findOne({ _id: following.followerId });
	const promisedFollowee = User.findOne({ _id: following.followeeId });

	await Promise.all([
		// Decrement following count
		User.update({ _id: following.followerId }, { $inc: { followingCount: -1 } }),
		promisedFollower.then(({ followingCount }) => FollowingLog.insert({
			userId: following.followerId,
			count: followingCount - 1
		})),

		// Decrement followers count
		User.update({ _id: following.followeeId }, { $inc: { followersCount: -1 } }),
		promisedFollowee.then(({ followersCount }) => FollowedLog.insert({
			userId: following.followeeId,
			count: followersCount - 1
		})),

		// Publish follow event
		Promise.all([promisedFollower, promisedFollowee]).then(async ([follower, followee]) => {
			if (isRemoteUser(follower)) {
				return;
			}

			const promisedPackedUser = packUser(followee, follower);

			if (isRemoteUser(followee)) {
				const undo = renderUndo(renderFollow(follower, followee));
				undo['@context'] = context;

				await request(follower, followee.account.inbox, undo);
			}

			stream(follower._id, 'unfollow', promisedPackedUser);
		})
	]);
};
