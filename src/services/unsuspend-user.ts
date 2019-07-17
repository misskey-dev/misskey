import renderDelete from '../remote/activitypub/renderer/delete';
import renderUndo from '../remote/activitypub/renderer/undo';
import { renderActivity } from '../remote/activitypub/renderer';
import { deliver } from '../queue';
import config from '../config';
import { User } from '../models/entities/user';
import { Users, Followings } from '../models';
import { Not, IsNull } from 'typeorm';

export async function doPostUnsuspend(user: User) {
	if (Users.isLocalUser(user)) {
		// 知り得る全SharedInboxにUndo Delete配信
		const content = renderActivity(renderUndo(renderDelete(`${config.url}/users/${user.id}`, user), user));

		const queue: string[] = [];

		const followings = await Followings.find({
			where: [
				{ followerSharedInbox: Not(IsNull()) },
				{ followeeSharedInbox: Not(IsNull()) }
			],
			select: ['followerSharedInbox', 'followeeSharedInbox']
		});

		const inboxes = followings.map(x => x.followerSharedInbox || x.followeeSharedInbox);

		for (const inbox of inboxes) {
			if (inbox != null && !queue.includes(inbox)) queue.push(inbox);
		}

		for (const inbox of queue) {
			deliver(user as any, content, inbox);
		}
	}
}
