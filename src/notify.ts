import * as mongo from 'mongodb';
import Notification from './models/notification';
import Mute from './models/mute';
import { pack } from './models/notification';
import { publishMainStream } from './stream';
import User from './models/user';
import pushSw from './push-sw';

export default (
	notifiee: mongo.ObjectID,
	notifier: mongo.ObjectID,
	type: string,
	content?: any
) => new Promise<any>(async (resolve, reject) => {
	if (notifiee.equals(notifier)) {
		return resolve();
	}

	// Create notification
	const notification = await Notification.insert(Object.assign({
		createdAt: new Date(),
		notifieeId: notifiee,
		notifierId: notifier,
		type: type,
		isRead: false
	}, content));

	resolve(notification);

	const packed = await pack(notification);

	// Publish notification event
	publishMainStream(notifiee, 'notification', packed);

	// Update flag
	User.update({ _id: notifiee }, {
		$set: {
			hasUnreadNotification: true
		}
	});

	// 3秒経っても(今回作成した)通知が既読にならなかったら「未読の通知がありますよ」イベントを発行する
	setTimeout(async () => {
		const fresh = await Notification.findOne({ _id: notification._id }, { isRead: true });
		if (!fresh.isRead) {
			//#region ただしミュートしているユーザーからの通知なら無視
			const mute = await Mute.find({
				muterId: notifiee,
				deletedAt: { $exists: false }
			});
			const mutedUserIds = mute.map(m => m.muteeId.toString());
			if (mutedUserIds.indexOf(notifier.toString()) != -1) {
				return;
			}
			//#endregion

			publishMainStream(notifiee, 'unreadNotification', packed);

			pushSw(notifiee, 'notification', packed);
		}
	}, 3000);
});
