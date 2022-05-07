import { Webhooks } from '@/models/index.js';
import { Webhook } from '@/models/entities/webhook.js';
import { subsdcriber } from '../db/redis.js';

let webhooksFetched = false;
let webhooks: Webhook[] = [];

export async function getActiveWebhooks() {
	if (!webhooksFetched) {
		webhooks = await Webhooks.findBy({
			active: true,
		});
		webhooksFetched = true;
	}

	return webhooks;
}

subsdcriber.on('message', async (_, data) => {
	const obj = JSON.parse(data);

	if (obj.channel === 'internal') {
		const { type, body } = obj.message;
		switch (type) {
			case 'webhookCreated':
				if (body.active) {
					webhooks.push(body);
				}
				break;
			case 'webhookUpdated':
				if (body.active) {
					const i = webhooks.findIndex(a => a.id === body.id);
					if (i > -1) {
						webhooks[i] = body;
					} else {
						webhooks.push(body);
					}
				} else {
					webhooks = webhooks.filter(a => a.id !== body.id);
				}
				break;
			case 'webhookDeleted':
				webhooks = webhooks.filter(a => a.id !== body.id);
				break;
			default:
				break;
		}
	}
});
