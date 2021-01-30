import * as push from 'web-push';
import config from '../config';
import { SwSubscriptions } from '../models';
import { fetchMeta } from '../misc/fetch-meta';
import { PackedNotification } from '../models/repositories/notification';
import { PackedMessagingMessage } from '../models/repositories/messaging-message';

type pushNotificationsTypes = {
	'notification': PackedNotification;
	'unreadMessagingMessage': PackedMessagingMessage;
	'readNotifications': { notificationIds: string[] };
	'readAllNotifications': undefined;
};

export default async function<T extends keyof pushNotificationsTypes>(userId: string, type: T, body: pushNotificationsTypes[T]) {
	const meta = await fetchMeta();

	if (!meta.enableServiceWorker || meta.swPublicKey == null || meta.swPrivateKey == null) return;

	// アプリケーションの連絡先と、サーバーサイドの鍵ペアの情報を登録
	push.setVapidDetails(config.url,
		meta.swPublicKey,
		meta.swPrivateKey);

	// Fetch
	const subscriptions = await SwSubscriptions.find({
		userId: userId
	});

	for (const subscription of subscriptions) {
		const pushSubscription = {
			endpoint: subscription.endpoint,
			keys: {
				auth: subscription.auth,
				p256dh: subscription.publickey
			}
		};

		push.sendNotification(pushSubscription, JSON.stringify({
			type, body, userId
		}), {
			proxy: config.proxy
		}).catch((err: any) => {
			//swLogger.info(err.statusCode);
			//swLogger.info(err.headers);
			//swLogger.info(err.body);

			if (err.statusCode === 410) {
				SwSubscriptions.delete({
					userId: userId,
					endpoint: subscription.endpoint,
					auth: subscription.auth,
					publickey: subscription.publickey
				});
			}
		});
	}
}
