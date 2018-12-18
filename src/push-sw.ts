const push = require('web-push');
import * as mongo from 'mongodb';
import Subscription from './models/sw-subscription';
import config from './config';

if (config.sw) {
	// アプリケーションの連絡先と、サーバーサイドの鍵ペアの情報を登録
	push.setVapidDetails(
		config.url,
		config.sw.publicKey,
		config.sw.privateKey);
}

export default async function(userId: mongo.ObjectID | string, type: string, body?: any) {
	if (!config.sw) return;

	if (typeof userId === 'string') {
		userId = new mongo.ObjectID(userId);
	}

	// Fetch
	const subscriptions = await Subscription.find({
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
			//console.log(err.statusCode);
			//console.log(err.headers);
			//console.log(err.body);

			if (err.statusCode == 410) {
				Subscription.remove({
					userId: userId,
					endpoint: subscription.endpoint,
					auth: subscription.auth,
					publickey: subscription.publickey
				});
			}
		});
	}
}
