import renderUpdate from '~/remote/activitypub/renderer/update';
import { renderActivity } from '~/remote/activitypub/renderer';
import { deliver } from '~/queue';
import { Followings, Users } from '~/models';
import { User } from '~/models/entities/user';
import { renderPerson } from '~/remote/activitypub/renderer/person';

export async function publishToFollowers(userId: User['id']) {
	const user = await Users.findOne(userId);
	if (user == null) throw new Error('user not found');

	const followers = await Followings.find({
		followeeId: user.id
	});

	const queue: string[] = [];

	// フォロワーがリモートユーザーかつ投稿者がローカルユーザーならUpdateを配信
	if (Users.isLocalUser(user)) {
		for (const following of followers) {
			if (Followings.isRemoteFollower(following)) {
				const inbox = following.followerSharedInbox || following.followerInbox;
				if (!queue.includes(inbox)) queue.push(inbox);
			}
		}

		if (queue.length > 0) {
			const content = renderActivity(renderUpdate(await renderPerson(user), user));
			for (const inbox of queue) {
				deliver(user, content, inbox);
			}
		}
	}
}
