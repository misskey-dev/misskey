/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { setTimeout } from 'node:timers/promises';
import * as Redis from 'ioredis';
import { Inject, Injectable, OnApplicationShutdown } from '@nestjs/common';
import { In } from 'typeorm';
import { DI } from '@/di-symbols.js';
import type { MutingsRepository, UserProfile, UserProfilesRepository, UsersRepository } from '@/models/index.js';
import type { User } from '@/models/entities/User.js';
import type { Notification } from '@/models/entities/Notification.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { bindThis } from '@/decorators.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import { PushNotificationService } from '@/core/PushNotificationService.js';
import { NotificationEntityService } from '@/core/entities/NotificationEntityService.js';
import { IdService } from '@/core/IdService.js';
import { CacheService } from '@/core/CacheService.js';

@Injectable()
export class NotificationService implements OnApplicationShutdown {
	#shutdownController = new AbortController();

	constructor(
		@Inject(DI.redis)
		private redisClient: Redis.Redis,

		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.userProfilesRepository)
		private userProfilesRepository: UserProfilesRepository,

		@Inject(DI.mutingsRepository)
		private mutingsRepository: MutingsRepository,

		private notificationEntityService: NotificationEntityService,
		private userEntityService: UserEntityService,
		private idService: IdService,
		private globalEventService: GlobalEventService,
		private pushNotificationService: PushNotificationService,
		private cacheService: CacheService,
	) {
	}

	@bindThis
	public async readAllNotification(
		userId: User['id'],
		force = false,
	) {
		const latestReadNotificationId = await this.redisClient.get(`latestReadNotification:${userId}`);

		const latestNotificationIdsRes = await this.redisClient.xrevrange(
			`notificationTimeline:${userId}`,
			'+',
			'-',
			'COUNT', 1);
		const latestNotificationId = latestNotificationIdsRes[0]?.[0];

		if (latestNotificationId == null) return;

		this.redisClient.set(`latestReadNotification:${userId}`, latestNotificationId);

		if (force || latestReadNotificationId == null || (latestReadNotificationId < latestNotificationId)) {
			return this.postReadAllNotifications(userId);
		}
	}

	@bindThis
	private postReadAllNotifications(userId: User['id']) {
		this.globalEventService.publishMainStream(userId, 'readAllNotifications');
		this.pushNotificationService.pushNotification(userId, 'readAllNotifications', undefined);
	}

	@bindThis
	public async createNotification(
		notifieeId: User['id'],
		type: Notification['type'],
		data: Partial<Notification>,
	): Promise<Notification | null> {
		const profile = await this.cacheService.userProfileCache.fetch(notifieeId);
		const isMuted = profile.mutingNotificationTypes.includes(type);
		if (isMuted) return null;

		if (data.notifierId) {
			if (notifieeId === data.notifierId) {
				return null;
			}

			const mutings = await this.cacheService.userMutingsCache.fetch(notifieeId);
			if (mutings.has(data.notifierId)) {
				return null;
			}
		}

		const notification = {
			id: this.idService.genId(),
			createdAt: new Date(),
			type: type,
			...data,
		} as Notification;

		const redisIdPromise = this.redisClient.xadd(
			`notificationTimeline:${notifieeId}`,
			'MAXLEN', '~', '300',
			'*',
			'data', JSON.stringify(notification));

		const packed = await this.notificationEntityService.pack(notification, notifieeId, {});

		// Publish notification event
		this.globalEventService.publishMainStream(notifieeId, 'notification', packed);

		// 2秒経っても(今回作成した)通知が既読にならなかったら「未読の通知がありますよ」イベントを発行する
		setTimeout(2000, 'unread notification', { signal: this.#shutdownController.signal }).then(async () => {
			const latestReadNotificationId = await this.redisClient.get(`latestReadNotification:${notifieeId}`);
			if (latestReadNotificationId && (latestReadNotificationId >= (await redisIdPromise)!)) return;

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

	@bindThis
	public dispose(): void {
		this.#shutdownController.abort();
	}

	@bindThis
	public onApplicationShutdown(signal?: string | undefined): void {
		this.dispose();
	}
}
