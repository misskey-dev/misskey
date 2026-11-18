/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable, OnApplicationShutdown } from '@nestjs/common';
import push from 'web-push';
import * as Redis from 'ioredis';
import { In } from 'typeorm';
import type { permissions } from 'misskey-js';
import { DI } from '@/di-symbols.js';
import type { Config } from '@/config.js';
import type { Packed } from '@/misc/json-schema.js';
import { getNoteSummary } from '@/misc/get-note-summary.js';
import type { AccessTokensRepository, MiMeta, MiSwSubscription, SwSubscriptionsRepository } from '@/models/_.js';
import { bindThis } from '@/decorators.js';
import { RedisKVCache } from '@/misc/cache.js';
import { HttpRequestService } from '@/core/HttpRequestService.js';

// Defined also packages/sw/types.ts#L13
type PushNotificationsTypes = {
	'notification': Packed<'Notification'>;
	'unreadAntennaNote': {
		antenna: { id: string, name: string };
		note: Packed<'Note'>;
	};
	'readAllNotifications': undefined;
	newChatMessage: Packed<'ChatMessage'>;
};

// アクセストークン経由で登録された購読に対して、各種別のプッシュ通知を送るために必要な権限
const requiredPermissions = {
	'notification': 'read:notifications',
	'unreadAntennaNote': 'read:account',
	'readAllNotifications': 'read:notifications',
	newChatMessage: 'read:chat',
} as const satisfies Record<keyof PushNotificationsTypes, typeof permissions[number]>;

type SwSubscriptionWithPermission = MiSwSubscription & {
	/**
	 * 購読を登録したアクセストークンが持つ権限
	 * ネイティブトークン (ログイントークン) で登録された購読の場合は null
	 */
	accessTokenPermission: string[] | null;
};

// Reduce length because push message servers have character limits
function truncateBody<T extends keyof PushNotificationsTypes>(type: T, body: PushNotificationsTypes[T]): PushNotificationsTypes[T] {
	if (typeof body !== 'object') return body;

	return {
		...body,
		...(('note' in body && body.note) ? {
			note: {
				...body.note,
				// textをgetNoteSummaryしたものに置き換える
				text: getNoteSummary(('type' in body && body.type === 'renote') ? body.note.renote as Packed<'Note'> : body.note),

				cw: undefined,
				reply: undefined,
				renote: undefined,
				user: type === 'notification' ? undefined as any : body.note.user,
			},
		} : {}),
	};
}

@Injectable()
export class PushNotificationService implements OnApplicationShutdown {
	private subscriptionsCache: RedisKVCache<SwSubscriptionWithPermission[]>;

	constructor(
		@Inject(DI.config)
		private config: Config,

		@Inject(DI.meta)
		private meta: MiMeta,

		@Inject(DI.redis)
		private redisClient: Redis.Redis,

		@Inject(DI.swSubscriptionsRepository)
		private swSubscriptionsRepository: SwSubscriptionsRepository,

		@Inject(DI.accessTokensRepository)
		private accessTokensRepository: AccessTokensRepository,

		private httpRequestService: HttpRequestService,
	) {
		this.subscriptionsCache = new RedisKVCache<SwSubscriptionWithPermission[]>(this.redisClient, 'userSwSubscriptions', {
			lifetime: 1000 * 60 * 60 * 1, // 1h
			memoryCacheLifetime: 1000 * 60 * 3, // 3m
			fetcher: (key) => this.fetchSubscriptions(key),
			toRedisConverter: (value) => JSON.stringify(value),
			fromRedisConverter: (value) => JSON.parse(value),
		});
	}

	@bindThis
	private async fetchSubscriptions(userId: string): Promise<SwSubscriptionWithPermission[]> {
		const subscriptions = await this.swSubscriptionsRepository.findBy({ userId });

		const accessTokenIds = subscriptions.map(s => s.accessTokenId).filter(id => id != null);
		const accessTokens = accessTokenIds.length > 0 ? await this.accessTokensRepository.find({
			where: { id: In(accessTokenIds) },
			relations: { app: true },
			select: { id: true, permission: true, app: { id: true, permission: true } },
		}) : [];
		// アプリ経由で発行されたトークンはアプリの権限が適用される
		const permissionMap = new Map(accessTokens.map(t => [t.id, t.app != null ? t.app.permission : t.permission]));

		return subscriptions.map(s => ({
			...s,
			accessTokenPermission: s.accessTokenId != null ? (permissionMap.get(s.accessTokenId) ?? []) : null,
		}));
	}

	@bindThis
	public isValidEndpoint(endpoint: string): boolean {
		let url: URL;
		try {
			url = new URL(endpoint);
		} catch {
			return false;
		}

		if (url.protocol !== 'https:') return false;
		if (url.username !== '' || url.password !== '') return false;

		return true;
	}

	@bindThis
	public async pushNotification<T extends keyof PushNotificationsTypes>(userId: string, type: T, body: PushNotificationsTypes[T]) {
		if (!this.meta.enableServiceWorker || this.meta.swPublicKey == null || this.meta.swPrivateKey == null) return;

		// アプリケーションの連絡先と、サーバーサイドの鍵ペアの情報を登録
		push.setVapidDetails(this.config.url,
			this.meta.swPublicKey,
			this.meta.swPrivateKey);

		const subscriptions = await this.subscriptionsCache.fetch(userId);

		for (const subscription of subscriptions) {
			if ([
				'readAllNotifications',
			].includes(type) && !subscription.sendReadMessage) continue;

			if (!this.isValidEndpoint(subscription.endpoint)) continue;

			// アクセストークン経由で登録された購読には、そのトークンで閲覧できる内容のみを送る
			if (subscription.accessTokenId != null && !(subscription.accessTokenPermission ?? []).includes(requiredPermissions[type])) continue;

			const pushSubscription = {
				endpoint: subscription.endpoint,
				keys: {
					auth: subscription.auth,
					p256dh: subscription.publickey,
				},
			};

			push.sendNotification(pushSubscription, JSON.stringify({
				type,
				body: (type === 'notification' || type === 'unreadAntennaNote') ? truncateBody(type, body) : body,
				userId,
				dateTime: Date.now(),
			}), {
				agent: this.httpRequestService.getAgentForHttps(new URL(subscription.endpoint)),
			}).catch((err: any) => {
				//swLogger.info(err.statusCode);
				//swLogger.info(err.headers);
				//swLogger.info(err.body);

				if (err.statusCode === 410 || err.statusCode === 404) {
					this.swSubscriptionsRepository.delete({
						userId: userId,
						endpoint: subscription.endpoint,
						auth: subscription.auth,
						publickey: subscription.publickey,
					}).then(() => {
						this.refreshCache(userId);
					});
				}
			});
		}
	}

	@bindThis
	public refreshCache(userId: string): void {
		this.subscriptionsCache.refresh(userId);
	}

	@bindThis
	public dispose(): void {
		this.subscriptionsCache.dispose();
	}

	@bindThis
	public onApplicationShutdown(signal?: string | undefined): void {
		this.dispose();
	}
}
