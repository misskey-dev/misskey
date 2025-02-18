/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { setTimeout } from 'node:timers/promises';
import * as Redis from 'ioredis';
import { Inject, Injectable, OnApplicationShutdown } from '@nestjs/common';
import { In } from 'typeorm';
import { DI } from '@/di-symbols.js';
import type { UsersRepository } from '@/models/_.js';
import type { MiUser } from '@/models/User.js';
import type { MiNotification } from '@/models/Notification.js';
import { bindThis } from '@/decorators.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import { PushNotificationService } from '@/core/PushNotificationService.js';
import { NotificationEntityService } from '@/core/entities/NotificationEntityService.js';
import { IdService } from '@/core/IdService.js';
import { CacheService } from '@/core/CacheService.js';
import type { Config } from '@/config.js';
import { UserListService } from '@/core/UserListService.js';
import type { FilterUnionByProperty } from '@/types.js';
import { trackPromise } from '@/misc/promise-tracker.js';

@Injectable()
export class NotificationService implements OnApplicationShutdown {
	#shutdownController = new AbortController();

	constructor(
		@Inject(DI.config)
		private config: Config,

		@Inject(DI.redis)
		private redisClient: Redis.Redis,

		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		private notificationEntityService: NotificationEntityService,
		private idService: IdService,
		private globalEventService: GlobalEventService,
		private pushNotificationService: PushNotificationService,
		private cacheService: CacheService,
		private userListService: UserListService,
	) {
	}

	@bindThis
	public async readAllNotification(
		userId: MiUser['id'],
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
	private postReadAllNotifications(userId: MiUser['id']) {
		this.globalEventService.publishMainStream(userId, 'readAllNotifications');
		this.pushNotificationService.pushNotification(userId, 'readAllNotifications', undefined);
	}

	@bindThis
	public createNotification<T extends MiNotification['type']>(
		notifieeId: MiUser['id'],
		type: T,
		data: Omit<FilterUnionByProperty<MiNotification, 'type', T>, 'type' | 'id' | 'createdAt' | 'notifierId'>,
		notifierId?: MiUser['id'] | null,
	) {
		trackPromise(
			this.#createNotificationInternal(notifieeId, type, data, notifierId),
		);
	}

	async #createNotificationInternal<T extends MiNotification['type']>(
		notifieeId: MiUser['id'],
		type: T,
		data: Omit<FilterUnionByProperty<MiNotification, 'type', T>, 'type' | 'id' | 'createdAt' | 'notifierId'>,
		notifierId?: MiUser['id'] | null,
	): Promise<MiNotification | null> {
		const profile = await this.cacheService.userProfileCache.fetch(notifieeId);

		// 古いMisskeyバージョンのキャッシュが残っている可能性がある
		// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
		const recieveConfig = (profile.notificationRecieveConfig ?? {})[type];
		if (recieveConfig?.type === 'never') {
			return null;
		}

		if (notifierId) {
			if (notifieeId === notifierId) {
				return null;
			}

			const mutings = await this.cacheService.userMutingsCache.fetch(notifieeId);
			if (mutings.has(notifierId)) {
				return null;
			}

			if (recieveConfig?.type === 'following') {
				const isFollowing = await this.cacheService.userFollowingsCache.fetch(notifieeId).then(followings => Object.hasOwn(followings, notifierId));
				if (!isFollowing) {
					return null;
				}
			} else if (recieveConfig?.type === 'follower') {
				const isFollower = await this.cacheService.userFollowingsCache.fetch(notifierId).then(followings => Object.hasOwn(followings, notifieeId));
				if (!isFollower) {
					return null;
				}
			} else if (recieveConfig?.type === 'mutualFollow') {
				const [isFollowing, isFollower] = await Promise.all([
					this.cacheService.userFollowingsCache.fetch(notifieeId).then(followings => Object.hasOwn(followings, notifierId)),
					this.cacheService.userFollowingsCache.fetch(notifierId).then(followings => Object.hasOwn(followings, notifieeId)),
				]);
				if (!(isFollowing && isFollower)) {
					return null;
				}
			} else if (recieveConfig?.type === 'followingOrFollower') {
				const [isFollowing, isFollower] = await Promise.all([
					this.cacheService.userFollowingsCache.fetch(notifieeId).then(followings => Object.hasOwn(followings, notifierId)),
					this.cacheService.userFollowingsCache.fetch(notifierId).then(followings => Object.hasOwn(followings, notifieeId)),
				]);
				if (!isFollowing && !isFollower) {
					return null;
				}
			} else if (recieveConfig?.type === 'list') {
				const isMember = await this.userListService.membersCache.fetch(recieveConfig.userListId).then(members => members.has(notifierId));
				if (!isMember) {
					return null;
				}
			}
		}

		const notification = {
			id: this.idService.gen(),
			createdAt: new Date(),
			type: type,
			...(notifierId ? {
				notifierId,
			} : {}),
			...data,
		} as unknown as FilterUnionByProperty<MiNotification, 'type', T>;

		const redisIdPromise = this.redisClient.xadd(
			`notificationTimeline:${notifieeId}`,
			'MAXLEN', '~', this.config.perUserNotificationsMaxCount.toString(),
			'*',
			'data', JSON.stringify(notification));

		const packed = await this.notificationEntityService.pack(notification, notifieeId, {});

		if (packed == null) return null;

		// Publish notification event
		this.globalEventService.publishMainStream(notifieeId, 'notification', packed);

		// 2秒経っても(今回作成した)通知が既読にならなかったら「未読の通知がありますよ」イベントを発行する
		// テスト通知の場合は即時発行
		const interval = notification.type === 'test' ? 0 : 2000;
		setTimeout(interval, 'unread notification', { signal: this.#shutdownController.signal }).then(async () => {
			const latestReadNotificationId = await this.redisClient.get(`latestReadNotification:${notifieeId}`);
			if (latestReadNotificationId && (latestReadNotificationId >= (await redisIdPromise)!)) return;

			this.globalEventService.publishMainStream(notifieeId, 'unreadNotification', packed);
			this.pushNotificationService.pushNotification(notifieeId, 'notification', packed);

			if (type === 'follow') this.emailNotificationFollow(notifieeId, await this.usersRepository.findOneByOrFail({ id: notifierId! }));
			if (type === 'receiveFollowRequest') this.emailNotificationReceiveFollowRequest(notifieeId, await this.usersRepository.findOneByOrFail({ id: notifierId! }));
		}, () => { /* aborted, ignore it */ });

		return notification;
	}

	// TODO
	//const locales = await import('../../../../locales/index.js');

	// TODO: locale ファイルをクライアント用とサーバー用で分けたい

	@bindThis
	private async emailNotificationFollow(userId: MiUser['id'], follower: MiUser) {
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
	private async emailNotificationReceiveFollowRequest(userId: MiUser['id'], follower: MiUser) {
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
	public async flushAllNotifications(userId: MiUser['id']) {
		await Promise.all([
			this.redisClient.del(`notificationTimeline:${userId}`),
			this.redisClient.del(`latestReadNotification:${userId}`),
		]);
		this.globalEventService.publishMainStream(userId, 'notificationFlushed');
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
