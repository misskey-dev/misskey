import { setTimeout } from 'node:timers/promises';
import { Inject, Injectable, OnApplicationShutdown } from '@nestjs/common';
import { In } from 'typeorm';
import { DI } from '@/di-symbols.js';
import type { MutingsRepository, NotificationsRepository, UserProfilesRepository, UsersRepository } from '@/models/index.js';
import type { User } from '@/models/entities/User.js';
import type { Notification } from '@/models/entities/Notification.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { bindThis } from '@/decorators.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import { PushNotificationService } from '@/core/PushNotificationService.js';
import { NotificationEntityService } from '@/core/entities/NotificationEntityService.js';
import { IdService } from '@/core/IdService.js';

@Injectable()
export class NotificationService implements OnApplicationShutdown {
	#shutdownController = new AbortController();

	constructor(
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.userProfilesRepository)
		private userProfilesRepository: UserProfilesRepository,

		@Inject(DI.notificationsRepository)
		private notificationsRepository: NotificationsRepository,

		@Inject(DI.mutingsRepository)
		private mutingsRepository: MutingsRepository,

		private notificationEntityService: NotificationEntityService,
		private userEntityService: UserEntityService,
		private idService: IdService,
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

	@bindThis
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
		this.globalEventService.publishMainStream(notifieeId, 'notification', packed);

		// 2秒経っても(今回作成した)通知が既読にならなかったら「未読の通知がありますよ」イベントを発行する
		setTimeout(2000, 'unread note', { signal: this.#shutdownController.signal }).then(async () => {
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

			this.globalEventService.publishMainStream(notifieeId, 'unreadNotification', packed);
			this.pushNotificationService.pushNotification(notifieeId, 'notification', packed);

			if (type === 'follow') this.emailNotificationFollow(notifieeId, await this.usersRepository.findOneByOrFail({ id: data.notifierId! }));
			if (type === 'receiveFollowRequest') this.emailNotificationReceiveFollowRequest(notifieeId, await this.usersRepository.findOneByOrFail({ id: data.notifierId! }));
		}, () => { /* aborted, ignore it */ });

		return notification;
	}

	// TODO
	//const locales = await import('../../../../locales/index.js');

	// TODO: locale ファイルをクライアント用とサーバー用で分けたい

	@bindThis
	private async emailNotificationFollow(userId: User['id'], follower: User) {
		/*
		const userProfile = await UserProfiles.findOneByOrFail({ userId: userId });
		if (!userProfile.email || !userProfile.emailNotificationTypes.includes('follow')) return;
		const locale = locales[userProfile.lang ?? 'ja-JP'];
		const i18n = new I18n(locale);
		// TODO: render user information html
		sendEmail(userProfile.email, i18n.t('_email._follow.title'), `${follower.name} (@${Acct.toString(follower)})`, `${follower.name} (@${Acct.toString(follower)})`);
		*/
	}

	@bindThis
	private async emailNotificationReceiveFollowRequest(userId: User['id'], follower: User) {
		/*
		const userProfile = await UserProfiles.findOneByOrFail({ userId: userId });
		if (!userProfile.email || !userProfile.emailNotificationTypes.includes('receiveFollowRequest')) return;
		const locale = locales[userProfile.lang ?? 'ja-JP'];
		const i18n = new I18n(locale);
		// TODO: render user information html
		sendEmail(userProfile.email, i18n.t('_email._receiveFollowRequest.title'), `${follower.name} (@${Acct.toString(follower)})`, `${follower.name} (@${Acct.toString(follower)})`);
		*/
	}

	onApplicationShutdown(signal?: string | undefined): void {
		this.#shutdownController.abort();
	}
}
