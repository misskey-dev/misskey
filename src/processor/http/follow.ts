import User, { isLocalUser, isRemoteUser, pack as packUser } from '../../models/user';
import Following from '../../models/following';
import FollowingLog from '../../models/following-log';
import FollowedLog from '../../models/followed-log';
import event from '../../publishers/stream';
import notify from '../../publishers/notify';
import context from '../../remote/activitypub/renderer/context';
import render from '../../remote/activitypub/renderer/follow';
import request from '../../remote/request';
import Logger from '../../utils/logger';

export default async ({ data }) => {
	const { followerId, followeeId } = await Following.findOne({ _id: data.following });
	const [follower, followee] = await Promise.all([
		User.findOne({ _id: followerId }),
		User.findOne({ _id: followeeId })
	]);

	if (isLocalUser(follower) && isRemoteUser(followee)) {
		const rendered = render(follower, followee);
		rendered['@context'] = context;

		await request(follower, followee.account.inbox, rendered);
	}

	try {
		await Promise.all([
			// Increment following count
			User.update(followerId, {
				$inc: {
					followingCount: 1
				}
			}),

			FollowingLog.insert({
				createdAt: data.following.createdAt,
				userId: followerId,
				count: follower.followingCount + 1
			}),

			// Increment followers count
			User.update({ _id: followeeId }, {
				$inc: {
					followersCount: 1
				}
			}),

			FollowedLog.insert({
				createdAt: data.following.createdAt,
				userId: followerId,
				count: followee.followersCount + 1
			}),

			// Publish follow event
			isLocalUser(follower) && packUser(followee, follower)
				.then(packed => event(follower._id, 'follow', packed)),

			isLocalUser(followee) && Promise.all([
				packUser(follower, followee)
					.then(packed => event(followee._id, 'followed', packed)),

				// Notify
				isLocalUser(followee) && notify(followeeId, followerId, 'follow')
			])
		]);
	} catch (error) {
		Logger.error(error.toString());
	}
};
