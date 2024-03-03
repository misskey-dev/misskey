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
import { EmailService } from '@/core/EmailService.js';
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
		private emailService: EmailService,
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
		} as any as FilterUnionByProperty<MiNotification, 'type', T>;

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

		}, () => { /* aborted, ignore it */ });
                if( profile.email ){
                        const follower = await this.usersRepository.findOneByOrFail({ id: notifierId! });
                        switch(type){
                                case 'mention':
                                        this.emailNotificationMention(profile, follower);
                                break;
                                case 'reply':
                                        this.emailNotificationReply(profile, follower);
                                break;
                                case 'quote' :
                                case 'renote':
                                        this.emailNotificationQuote(profile, follower);
                                break;
                                case 'follow':
                                        this.emailNotificationFollow(profile, follower);
                                break;
                                case 'receiveFollowRequest':
                                        this.emailNotificationReceiveFollowRequest(profile, follower);
                                break;
                        }
                }

		return notification;
	}

	// TODO
	//const locales = await import('../../../../locales/index.js');

	// TODO: locale ファイルをクライアント用とサーバー用で分けたい

	@bindThis
       	private async emailNotificationMention(profile: UserProfile, follower: MiUser) {
               console.log('-------emailNotificationMention-------');
               if ( !profile.emailNotificationTypes.includes('mention')) return;
               this.emailNotificationEtc( profile.email , follower,
                       'メンション/ダイレクトメッセージが来ています',
                       'からメンション/ダイレクトメッセージが来ています');
       	}

       	@bindThis
       	private async emailNotificationReply(profile: UserProfile, follower: MiUser) {
               console.log('-------emailNotificationRelpy-------');
               if ( !profile.emailNotificationTypes.includes('reply')) return;
               this.emailNotificationEtc( profile.email , follower,
                       'リプライされました',
                       'にリプライされました');
       	}

       	@bindThis
       	private async emailNotificationQuote(profile: UserProfile, follower: MiUser) {
               console.log('-------emailNotificationMention-------');
               if (!profile.emailNotificationTypes.includes('quote')) return;
               this.emailNotificationEtc( profile.email , follower,
                       '引用、リノートされました',
                       'に引用、又は、リノートされました');
        }

       	@bindThis
	private async emailNotificationFollow(profile: UserProfile, follower: MiUser) {
               console.log('-------emailNotificationFollow-------');
               if ( !profile.emailNotificationTypes.includes('follow')) return;
               this.emailNotificationEtc( profile.email , follower,
                       'フォローされました',
                       'にフォローされました');
       }

       @bindThis
       private async emailNotificationReceiveFollowRequest(profile: UserProfile, follower: MiUser) {
               console.log('-------emailNotificationReceiveFollowRequest-------');
               if ( !profile.emailNotificationTypes.includes('receiveFollowRequest')) return;
               this.emailNotificationEtc( profile.email , follower,
                       'フォローリクエストが届いています',
                       'からフォローリクエストが届いています');
       }

       @bindThis
       private async emailNotificationEtc(mailAddr: string , follower: MiUser, title:String, message:String) {
               let messageText = title;
               let htmlText    = title;
               if ( follower ){
                       let nameText = follower.name;
                       if ( !nameText ) nameText = follower.username;
                       let hostName = follower.host;
                       if ( !hostName ) hostName = this.config.host;
                       let addressText = `<i>@${follower.username}@${hostName}</i>`;
                       messageText = `<font size=+3>${nameText} さん</font><br>${addressText}<br><p align="right">${message}</p>`;
                       htmlText  = messageText;
                       if( follower.avatarUrl ){
                               htmlText = `<img src="${follower.avatarUrl}"  width="48" height="48">${messageText}`;
                       }
               }
               this.emailService.sendEmail(mailAddr, title , htmlText,messageText);
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
