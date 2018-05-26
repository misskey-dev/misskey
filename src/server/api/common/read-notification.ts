import * as mongo from 'mongodb';
import { default as Notification, INotification } from '../../../models/notification';
import publishUserStream from '../../../publishers/stream';
import Mute from '../../../models/mute';

/**
 * Mark as read notification(s)
 */
export default (
	user: string | mongo.ObjectID,
	message: string | string[] | INotification | INotification[] | mongo.ObjectID | mongo.ObjectID[]
) => new Promise<any>(async (resolve, reject) => {

	const userId = mongo.ObjectID.prototype.isPrototypeOf(user)
		? user
		: new mongo.ObjectID(user);

	const ids: mongo.ObjectID[] = Array.isArray(message)
		? mongo.ObjectID.prototype.isPrototypeOf(message[0])
			? (message as mongo.ObjectID[])
			: typeof message[0] === 'string'
				? (message as string[]).map(m => new mongo.ObjectID(m))
				: (message as INotification[]).map(m => m._id)
		: mongo.ObjectID.prototype.isPrototypeOf(message)
			? [(message as mongo.ObjectID)]
			: typeof message === 'string'
				? [new mongo.ObjectID(message)]
				: [(message as INotification)._id];

	const mute = await Mute.find({
		muterId: userId
	});
	const mutedUserIds = mute.map(m => m.muteeId);

	// Update documents
	await Notification.update({
		_id: { $in: ids },
		isRead: false
	}, {
		$set: {
			isRead: true
		}
	}, {
		multi: true
	});

	// Calc count of my unread notifications
	const count = await Notification
		.count({
			notifieeId: userId,
			notifierId: {
				$nin: mutedUserIds
			},
			isRead: false
		}, {
			limit: 1
		});

	if (count == 0) {
		// 全ての(いままで未読だった)通知を(これで)読みましたよというイベントを発行
		publishUserStream(userId, 'read_all_notifications');
	}
});
