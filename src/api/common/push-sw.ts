const push = require('web-push');
import * as mongo from 'mongodb';
import Subscription from '../models/sw-subscription';
import config from '../../conf';

push.setGCMAPIKey(config.sw.gcm_api_key);

export default async function(userId: mongo.ObjectID | string, type, body?) {
	if (typeof userId === 'string') {
		userId = new mongo.ObjectID(userId);
	}

	// Fetch
	const subscriptions = await Subscription.find({
		user_id: userId
	});

	subscriptions.forEach(subscription => {
		const pushSubscription = {
			endpoint: subscription.endpoint,
			keys: {
				auth: subscription.auth,
				p256dh: subscription.publickey
			}
		};

		push.sendNotification(pushSubscription, JSON.stringify({
			type, body
		})).catch(err => {
			//console.log(err.statusCode);
			//console.log(err.headers);
			//console.log(err.body);

			if (err.statusCode == 410) {
				Subscription.remove({
					user_id: userId,
					endpoint: subscription.endpoint,
					auth: subscription.auth,
					publickey: subscription.publickey
				});
			}
		});
	});
}
