import FollowedLog from '../../../../models/followed-log';
import Following from '../../../../models/following';
import FollowingLog from '../../../../models/following-log';
import User from '../../../../models/user';

export default async (resolver, { $id }) => {
	const following = await Following.findOneAndDelete({ _id: $id });
	if (following === null) {
		return;
	}

	await Promise.all([
		User.update({ _id: following.followerId }, { $inc: { followingCount: -1 } }),
		User.findOne({ _id: following.followerId }).then(({ followingCount }) => FollowingLog.insert({
			userId: following.followerId,
			count: followingCount - 1
		})),
		User.update({ _id: following.followeeId }, { $inc: { followersCount: -1 } }),
		User.findOne({ _id: following.followeeId }).then(({ followersCount }) => FollowedLog.insert({
			userId: following.followeeId,
			count: followersCount - 1
		})),
	]);
};
