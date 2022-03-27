import accept from './accept.js';
import { User } from '@/models/entities/user.js';
import { FollowRequests, Users } from '@/models/index.js';

/**
 * 指定したユーザー宛てのフォローリクエストをすべて承認
 * @param user ユーザー
 */
export default async function(user: { id: User['id']; host: User['host']; uri: User['host']; inbox: User['inbox']; sharedInbox: User['sharedInbox']; }) {
	const requests = await FollowRequests.findBy({
		followeeId: user.id,
	});

	for (const request of requests) {
		const follower = await Users.findOneByOrFail({ id: request.followerId });
		accept(user, follower);
	}
}
