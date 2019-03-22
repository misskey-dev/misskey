import { pack } from '../models/notification';
import { publishMainStream } from './stream';
import pushSw from './push-notification';

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
	const notification = await Notification.insert(Object.assign({
		createdAt: new Date(),
		notifieeId: notifieeId,
		notifierId: notifierId,
		type: type,
		isRead: false
	}, content));

	resolve(notification);

	const packed = await pack(notification);

	// Publish notification event
	publishMainStream(notifieeId, 'notification', packed);

	// Update flag
	User.update({ _id: notifieeId }, {
		$set: {
			hasUnreadNotification: true
		}
	});

	// 2秒経っても(今回作成した)通知が既読にならなかったら「未読の通知がありますよ」イベントを発行する
	setTimeout(async () => {
		const fresh = await Notification.findOne({ _id: notification.id }, { isRead: true });
		if (!fresh.isRead) {
			//#region ただしミュートしているユーザーからの通知なら無視
			const mute = await Mute.find({
				muterId: notifieeId,
				deletedAt: { $exists: false }
			});
			const mutedUserIds = mute.map(m => m.muteeId.toString());
			if (mutedUserIds.indexOf(notifierId.toString()) != -1) {
				return;
			}
			//#endregion

			publishMainStream(notifieeId, 'unreadNotification', packed);

			pushSw(notifieeId, 'notification', packed);
		}
	}, 2000);
});
