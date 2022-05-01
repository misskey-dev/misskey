import { publishMainStream } from '@/services/stream.js';
import { pushNotification } from '@/services/push-notification.js';
import { Notifications, Mutings, UserProfiles, Users } from '@/models/index.js';
import { genId } from '@/misc/gen-id.js';
import { User } from '@/models/entities/user.js';
import { Notification } from '@/models/entities/notification.js';
import { sendEmailNotification } from './send-email-notification.js';

export async function createNotification(
	notifieeId: User['id'],
	type: Notification['type'],
	data: Partial<Notification>
) {
	if (data.notifierId && (notifieeId === data.notifierId)) {
		return null;
	}

	const profile = await UserProfiles.findOneBy({ userId: notifieeId });

	const isMuted = profile?.mutingNotificationTypes.includes(type);

	// Create notification
	const notification = await Notifications.insert({
		id: genId(),
		createdAt: new Date(),
		notifieeId: notifieeId,
		type: type,
		// 相手がこの通知をミュートしているようなら、既読を予めつけておく
		isRead: isMuted,
		...data,
	} as Partial<Notification>)
		.then(x => Notifications.findOneByOrFail(x.identifiers[0]));

	const packed = await Notifications.pack(notification, {});

	// Publish notification event
	publishMainStream(notifieeId, 'notification', packed);

	// 2秒経っても(今回作成した)通知が既読にならなかったら「未読の通知がありますよ」イベントを発行する
	setTimeout(async () => {
		const fresh = await Notifications.findOneBy({ id: notification.id });
		if (fresh == null) return; // 既に削除されているかもしれない
		if (fresh.isRead) return;

		//#region ただしミュートしているユーザーからの通知なら無視
		const mutings = await Mutings.findBy({
			muterId: notifieeId,
		});
		if (data.notifierId && mutings.map(m => m.muteeId).includes(data.notifierId)) {
			return;
		}
		//#endregion

		publishMainStream(notifieeId, 'unreadNotification', packed);
		pushNotification(notifieeId, 'notification', packed);

		if (type === 'follow') sendEmailNotification.follow(notifieeId, await Users.findOneByOrFail({ id: data.notifierId! }));
		if (type === 'receiveFollowRequest') sendEmailNotification.receiveFollowRequest(notifieeId, await Users.findOneByOrFail({ id: data.notifierId! }));
	}, 2000);

	return notification;
}
