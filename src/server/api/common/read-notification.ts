import { publishMainStream } from '../../../services/stream';
import { User } from '../../../models/entities/user';
import { Notification } from '../../../models/entities/notification';
import { Notifications, Users } from '../../../models';
import { In } from 'typeorm';

/**
 * Mark notifications as read
 */
export async function readNotification(
	userId: User['id'],
	notificationIds: Notification['id'][]
) {
	// Update documents
	const updatedNotificatons = await Notifications.update({
		id: In(notificationIds),
		isRead: false
	}, {
		isRead: true
	});

	if (!await Users.getHasUnreadNotification(userId)) {
		// ユーザーのすべての通知が既読だったら、
		// 全ての(いままで未読だった)通知を(これで)読みましたよというイベントを発行
		publishMainStream(userId, 'readAllNotifications');
	} else {
		// まだすべて既読になっていなければ、
		// アップデートしたという
		const updatedNotificationsIds = updatedNotificatons.generatedMaps.map(e => e.id);
		publishMainStream(userId, 'readNotifications', updatedNotificationsIds);
	}
}
