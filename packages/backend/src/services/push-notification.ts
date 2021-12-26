import * as push from 'web-push';
import config from '@/config/index';
import { SwSubscriptions } from '@/models/index';
import { fetchMeta } from '@/misc/fetch-meta';
import { Packed } from '@/misc/schema';
import { getNoteSummary } from '@/misc/get-note-summary';

type notificationType = 'notification' | 'unreadMessagingMessage';
type notificationBody = Packed<'Notification'> | Packed<'MessagingMessage'>;

// プッシュメッセージサーバーには文字数制限があるため、内容を削減します
function truncateNotification(notification: Packed<'Notification'>): any {
	if (notification.note) {
		return {
			...notification,
			note: {
				...notification.note,
				// textをgetNoteSummaryしたものに置き換える
				text: getNoteSummary(notification.type === 'renote' ? notification.note.renote as Packed<'Note'> : notification.note),
				...{
					cw: undefined,
					reply: undefined,
					renote: undefined,
					user: undefined as any, // 通知を受け取ったユーザーである場合が多いのでこれも捨てる
				}
			}
		};
	}

	return notification;
}

export default async function(userId: string, type: notificationType, body: notificationBody) {
	const meta = await fetchMeta();

	if (!meta.enableServiceWorker || meta.swPublicKey == null || meta.swPrivateKey == null) return;

	// アプリケーションの連絡先と、サーバーサイドの鍵ペアの情報を登録
	push.setVapidDetails(config.url,
		meta.swPublicKey,
		meta.swPrivateKey);

	// Fetch
	const subscriptions = await SwSubscriptions.find({
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
