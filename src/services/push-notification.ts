import * as push from 'web-push';
import config from '../config';
import { SwSubscriptions } from '../models';
import { Meta } from '../models/entities/meta';
import fetchMeta from '../misc/fetch-meta';

let meta: Meta = null;

setInterval(() => {
	fetchMeta().then(m => {
		meta = m;

		if (meta.enableServiceWorker) {
			// アプリケーションの連絡先と、サーバーサイドの鍵ペアの情報を登録
			push.setVapidDetails(config.url,
				meta.swPublicKey,
				meta.swPrivateKey);
		}
	});
}, 3000);

export default async function(userId: string, type: string, body?: any) {
	if (!meta.enableServiceWorker) return;

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
			type, body
		})).catch((err: any) => {
			//swLogger.info(err.statusCode);
			//swLogger.info(err.headers);
			//swLogger.info(err.body);

			if (err.statusCode == 410) {
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
