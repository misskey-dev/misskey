import { URL } from 'node:url';
import Bull from 'bull';
import Logger from '@/services/logger.js';
import { WebhookDeliverJobData } from '../types.js';
import { getResponse, StatusError } from '@/misc/fetch.js';
import { Webhooks } from '@/models/index.js';
import config from '@/config/index.js';

const logger = new Logger('webhook');

let latest: string | null = null;

export default async (job: Bull.Job<WebhookDeliverJobData>) => {
	try {
		if (latest !== (latest = JSON.stringify(job.data.content, null, 2))) {
			logger.debug(`delivering ${latest}`);
		}

		const res = await getResponse({
			url: job.data.to,
			method: 'POST',
			headers: {
				'User-Agent': 'Misskey-Hooks',
				'X-Misskey-Host': config.host,
				'X-Misskey-Hook-Id': job.data.webhookId,
				'X-Misskey-Hook-Secret': job.data.secret,
			},
			body: JSON.stringify(job.data.content),
		});

		Webhooks.update({ id: job.data.webhookId }, {
			latestSentAt: new Date(),
			latestStatus: res.status,
		});

		return 'Success';
	} catch (res) {
		Webhooks.update({ id: job.data.webhookId }, {
			latestSentAt: new Date(),
			latestStatus: res instanceof StatusError ? res.statusCode : 1,
		});

		if (res instanceof StatusError) {
			// 4xx
			if (res.isClientError) {
				return `${res.statusCode} ${res.statusMessage}`;
			}

			// 5xx etc.
			throw `${res.statusCode} ${res.statusMessage}`;
		} else {
			// DNS error, socket error, timeout ...
			throw res;
		}
	}
};
