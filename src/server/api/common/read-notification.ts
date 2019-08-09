import { publishMainStream } from '~/services/stream';
import { User } from '~/models/entities/user';
import { Notification } from '~/models/entities/notification';
import { Mutings, Notifications } from '~/models';
import { In, Not } from 'typeorm';

/**
 * Mark notifications as read
 */
export async function readNotification(
	userId: User['id'],
	notificationIds: Notification['id'][]
) {
	const mute = await Mutings.find({
		muterId: userId
	});
	const mutedUserIds = mute.map(m => m.muteeId);

	// Update documents
	await Notifications.update({
		id: In(notificationIds),
		isRead: false
	}, {
		isRead: true
	});

	// Calc count of my unread notifications
	const count = await Notifications.count({
		notifieeId: userId,
		...(mutedUserIds.length > 0 ? { notifierId: Not(In(mutedUserIds)) } : {}),
		isRead: false
	});

	if (count === 0) {
		// 全ての(いままで未読だった)通知を(これで)読みましたよというイベントを発行
		publishMainStream(userId, 'readAllNotifications');
	}
}
