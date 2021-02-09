import { publishMainStream } from '../../../services/stream';
import { pushNotification } from '../../../services/push-notification';
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
	await Notifications.update({
		id: In(notificationIds),
		isRead: false
	}, {
		isRead: true
	});

	if (!await Users.getHasUnreadNotification(userId)) {
		// ユーザーのすべての通知が既読だったら、
		// 全ての(いままで未読だった)通知を(これで)読みましたよというイベントを発行
		publishMainStream(userId, 'readAllNotifications');
		pushNotification(userId, 'readAllNotifications', undefined);
	} else {
		// まだすべて既読になっていなければ、各クライアントにnotificationIdsを伝達
		publishMainStream(userId, 'readNotifications', notificationIds);
		pushNotification(userId, 'readNotifications', { notificationIds });
	}
}
