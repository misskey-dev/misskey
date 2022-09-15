import { Inject, Injectable } from '@nestjs/common';
import type { Mutings, Notifications, UserProfiles , Users } from '@/models/index.js';
import type { User } from '@/models/entities/user.js';
import type { Notification } from '@/models/entities/notification.js';
import { GlobalEventService } from '@/services/GlobalEventService.js';
import { IdService } from '@/services/IdService.js';
import { NotificationEntityService } from './entities/NotificationEntityService';

@Injectable()
export class CreateNotificationService {
	constructor(
		@Inject('usersRepository')
		private usersRepository: typeof Users,

		@Inject('userProfilesRepository')
		private userProfilesRepository: typeof UserProfiles,

		@Inject('notificationsRepository')
		private notificationsRepository: typeof Notifications,

		@Inject('mutingsRepository')
		private mutingsRepository: typeof Mutings,

		private notificationEntityService: NotificationEntityService,
		private idService: IdService,
		private globalEventServie: GlobalEventService,
	) {
	}

	public async createNotification(
		notifieeId: User['id'],
		type: Notification['type'],
		data: Partial<Notification>,
	): Promise<Notification | null> {
		if (data.notifierId && (notifieeId === data.notifierId)) {
			return null;
		}
	
		const profile = await this.userProfilesRepository.findOneBy({ userId: notifieeId });
	
		const isMuted = profile?.mutingNotificationTypes.includes(type);
	
		// Create notification
		const notification = await this.notificationsRepository.insert({
			id: this.idService.genId(),
			createdAt: new Date(),
			notifieeId: notifieeId,
			type: type,
			// 相手がこの通知をミュートしているようなら、既読を予めつけておく
			isRead: isMuted,
			...data,
		} as Partial<Notification>)
			.then(x => this.notificationsRepository.findOneByOrFail(x.identifiers[0]));
	
		const packed = await this.notificationEntityService.pack(notification, {});
	
		// Publish notification event
		this.globalEventServie.publishMainStream(notifieeId, 'notification', packed);
	
		// 2秒経っても(今回作成した)通知が既読にならなかったら「未読の通知がありますよ」イベントを発行する
		setTimeout(async () => {
			const fresh = await this.notificationsRepository.findOneBy({ id: notification.id });
			if (fresh == null) return; // 既に削除されているかもしれない
			if (fresh.isRead) return;
	
			//#region ただしミュートしているユーザーからの通知なら無視
			const mutings = await this.mutingsRepository.findBy({
				muterId: notifieeId,
			});
			if (data.notifierId && mutings.map(m => m.muteeId).includes(data.notifierId)) {
				return;
			}
			//#endregion
	
			this.globalEventServie.publishMainStream(notifieeId, 'unreadNotification', packed);
			pushNotification(notifieeId, 'notification', packed);
	
			if (type === 'follow') sendEmailNotification.follow(notifieeId, await this.usersRepository.findOneByOrFail({ id: data.notifierId! }));
			if (type === 'receiveFollowRequest') sendEmailNotification.receiveFollowRequest(notifieeId, await this.usersRepository.findOneByOrFail({ id: data.notifierId! }));
		}, 2000);
	
		return notification;
	}
}
