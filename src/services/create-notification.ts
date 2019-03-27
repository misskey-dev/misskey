import { pack } from '../models/entities/notification';
import { publishMainStream } from './stream';
import pushSw from './push-notification';
import { Notifications, Mutings } from '../models';

export default (
	notifieeId: any,
	notifierId: any,
	type: string,
	content?: any
) => new Promise<any>(async (resolve, reject) => {
	if (notifieeId.equals(notifierId)) {
		return resolve();
	}

	// Create notification
	const notification = await Notifications.save({
		createdAt: new Date(),
		notifieeId: notifieeId,
		notifierId: notifierId,
		type: type,
		data: content,
		isRead: false,
	});

	resolve(notification);

	const packed = await pack(notification);

	// Publish notification event
	publishMainStream(notifieeId, 'notification', packed);

	// 2秒経っても(今回作成した)通知が既読にならなかったら「未読の通知がありますよ」イベントを発行する
	setTimeout(async () => {
		const fresh = await Notifications.findOne(notification.id);
		if (!fresh.isRead) {
			//#region ただしミュートしているユーザーからの通知なら無視
			const mutings = await Mutings.find({
				muterId: notifieeId
			});
			const mutedUserIds = mutings.map(m => m.muteeId);
			if (mutedUserIds.includes(notifierId)) {
				return;
			}
			//#endregion

			publishMainStream(notifieeId, 'unreadNotification', packed);

			pushSw(notifieeId, 'notification', packed);
		}
	}, 2000);
});
