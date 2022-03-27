import push from 'web-push';
import config from '@/config/index.js';
import { SwSubscriptions } from '@/models/index.js';
import { fetchMeta } from '@/misc/fetch-meta.js';
import { Packed } from '@/misc/schema.js';
import { getNoteSummary } from '@/misc/get-note-summary.js';

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
			}
		};
	}

	return notification;
}

export async function pushNotification<T extends keyof pushNotificationsTypes>(userId: string, type: T, body: pushNotificationsTypes[T]) {
	const meta = await fetchMeta();

	if (!meta.enableServiceWorker || meta.swPublicKey == null || meta.swPrivateKey == null) return;

	// アプリケーションの連絡先と、サーバーサイドの鍵ペアの情報を登録
	push.setVapidDetails(config.url,
		meta.swPublicKey,
		meta.swPrivateKey);

	// Fetch
	const subscriptions = await SwSubscriptions.findBy({
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
		}), {
			proxy: config.proxy,
		}).catch((err: any) => {
			//swLogger.info(err.statusCode);
			//swLogger.info(err.headers);
			//swLogger.info(err.body);

			if (err.statusCode === 410) {
				SwSubscriptions.delete({
					userId: userId,
					endpoint: subscription.endpoint,
					auth: subscription.auth,
					publickey: subscription.publickey,
				});
			}
		});
	}
}
