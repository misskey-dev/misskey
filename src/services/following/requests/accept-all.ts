import User, { User } from '../../../models/entities/user';
import FollowRequest from '../../../models/entities/follow-request';
import accept from './accept';

/**
 * 指定したユーザー宛てのフォローリクエストをすべて承認
 * @param user ユーザー
 */
export default async function(user: User) {
	const requests = await FollowRequest.find({
		followeeId: user.id
	});

	for (const request of requests) {
		const follower = await Users.findOne({ _id: request.followerId });
		accept(user, follower);
	}

	User.update({ _id: user.id }, {
		$set: {
			pendingReceivedFollowRequestsCount: 0
		}
	});
}
