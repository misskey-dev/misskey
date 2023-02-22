import { Inject, Injectable } from '@nestjs/common';
import { In } from 'typeorm';
import { DI } from '@/di-symbols.js';
import type { NotificationsRepository } from '@/models/index.js';
import type { User } from '@/models/entities/User.js';
import type { Notification } from '@/models/entities/Notification.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { bindThis } from '@/decorators.js';
import { GlobalEventService } from './GlobalEventService.js';
import { PushNotificationService } from './PushNotificationService.js';

@Injectable()
export class NotificationService {
	constructor(
		@Inject(DI.notificationsRepository)
		private notificationsRepository: NotificationsRepository,

		private userEntityService: UserEntityService,
		private globalEventService: GlobalEventService,
		private pushNotificationService: PushNotificationService,
	) {
	}

	@bindThis
	public async readNotification(
		userId: User['id'],
		notificationIds: Notification['id'][],
	) {
		if (notificationIds.length === 0) return;

		// Update documents
		const result = await this.notificationsRepository.update({
			notifieeId: userId,
			id: In(notificationIds),
			isRead: false,
		}, {
			isRead: true,
		});

		if (result.affected === 0) return;

		if (!await this.userEntityService.getHasUnreadNotification(userId)) return this.postReadAllNotifications(userId);
		else return this.postReadNotifications(userId, notificationIds);
	}

	@bindThis
	public async readNotificationByQuery(
		userId: User['id'],
		query: Record<string, any>,
	) {
		const notificationIds = await this.notificationsRepository.findBy({
			...query,
			notifieeId: userId,
			isRead: false,
		}).then(notifications => notifications.map(notification => notification.id));

		return this.readNotification(userId, notificationIds);
	}

	@bindThis
	private postReadAllNotifications(userId: User['id']) {
		this.globalEventService.publishMainStream(userId, 'readAllNotifications');
		return this.pushNotificationService.pushNotification(userId, 'readAllNotifications', undefined);
	}

	@bindThis
	private postReadNotifications(userId: User['id'], notificationIds: Notification['id'][]) {
		return this.pushNotificationService.pushNotification(userId, 'readNotifications', { notificationIds });
	}
}
