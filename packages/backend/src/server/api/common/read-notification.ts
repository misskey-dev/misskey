import { publishMainStream } from '@/services/stream';
import { User } from '@/models/entities/user';
import { Notification } from '@/models/entities/notification';
import { Notifications, Users } from '@/models/index';
import { In } from 'typeorm';

export async function readNotification(
	userId: User['id'],
	notificationIds: Notification['id'][]
) {
	// Update documents
	await Notifications.update({
		id: In(notificationIds),
		isRead: false,
	}, {
		isRead: true,
	});

	post(userId);
}

export async function readNotificationByQuery(
	userId: User['id'],
	query: Record<string, any>
) {
	// Update documents
	await Notifications.update({
		...query,
		notifieeId: userId,
		isRead: false,
	}, {
		isRead: true,
	});

	post(userId);
}

async function post(userId: User['id']) {
	if (!await Users.getHasUnreadNotification(userId)) {
		// 全ての(いままで未読だった)通知を(これで)読みましたよというイベントを発行
		publishMainStream(userId, 'readAllNotifications');
	}
}
