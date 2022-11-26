import { Inject, Injectable } from '@nestjs/common';
import push from 'web-push';
import { DI } from '@/di-symbols.js';
import type { Config } from '@/config.js';
import type { Packed } from '@/misc/schema';
import { getNoteSummary } from '@/misc/get-note-summary.js';
import type { SwSubscriptionsRepository } from '@/models/index.js';
import { MetaService } from './MetaService.js';

// Defined also packages/sw/types.ts#L14-L21
type pushNotificationsTypes = {
	'notification': Packed<'Notification'>;
	'unreadMessagingMessage': Packed<'MessagingMessage'>;
	'readNotifications': { notificationIds: string[] };
	'readAllNotifications': undefined;
	'readAllMessagingMessages': undefined;
	'readAllMessagingMessagesOfARoom': { userId: string } | { groupId: string };
};

// プッシュメッセージサーバーには文字数制限があるため、内容を削減します
function truncateNotification(notification: Packed<'Notification'>): any {
	if (notification.note) {
		return {
			...notification,
			note: {
				...notification.note,
				// textをgetNoteSummaryしたものに置き換える
				text: getNoteSummary(notification.type === 'renote' ? notification.note.renote as Packed<'Note'> : notification.note),

				cw: undefined,
				reply: undefined,
				renote: undefined,
				user: undefined as any, // 通知を受け取ったユーザーである場合が多いのでこれも捨てる
			},
		};
	}

	return notification;
}

@Injectable()
export class PushNotificationService {
	constructor(
		@Inject(DI.config)
		private config: Config,

		@Inject(DI.swSubscriptionsRepository)
		private swSubscriptionsRepository: SwSubscriptionsRepository,

		private metaService: MetaService,
	) {
	}

	public async pushNotification<T extends keyof pushNotificationsTypes>(userId: string, type: T, body: pushNotificationsTypes[T]) {
		const meta = await this.metaService.fetch();
	
		if (!meta.enableServiceWorker || meta.swPublicKey == null || meta.swPrivateKey == null) return;
	
		// アプリケーションの連絡先と、サーバーサイドの鍵ペアの情報を登録
		push.setVapidDetails(this.config.url,
			meta.swPublicKey,
			meta.swPrivateKey);
	
		// Fetch
		const subscriptions = await this.swSubscriptionsRepository.findBy({
			userId: userId,
		});
	
		for (const subscription of subscriptions) {
			const pushSubscription = {
				endpoint: subscription.endpoint,
				keys: {
					auth: subscription.auth,
					p256dh: subscription.publickey,
				},
			};
	
			push.sendNotification(pushSubscription, JSON.stringify({
				type,
				body: type === 'notification' ? truncateNotification(body as Packed<'Notification'>) : body,
				userId,
				dateTime: (new Date()).getTime(),
			}), {
				proxy: this.config.proxy,
			}).catch((err: any) => {
				//swLogger.info(err.statusCode);
				//swLogger.info(err.headers);
				//swLogger.info(err.body);
	
				if (err.statusCode === 410) {
					this.swSubscriptionsRepository.delete({
						userId: userId,
						endpoint: subscription.endpoint,
						auth: subscription.auth,
						publickey: subscription.publickey,
					});
				}
			});
		}
	}
}
