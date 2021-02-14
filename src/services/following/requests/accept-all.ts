import accept from './accept';
import { User } from '../../../models/entities/user';
import { FollowRequests, Users } from '../../../models';

/**
 * 指定したユーザー宛てのフォローリクエストをすべて承認
 * @param user ユーザー
 */
export default async function(user: User) {
	const requests = await FollowRequests.find({
		followeeId: user.id
	});

	for (const request of requests) {
		const follower = await Users.findOneOrFail(request.followerId);
		accept(user, follower);
	}
}
