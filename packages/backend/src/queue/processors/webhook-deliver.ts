import { URL } from 'node:url';
import Bull from 'bull';
import Logger from '@/services/logger.js';
import { WebhookDeliverJobData } from '../types.js';
import { getResponse, StatusError } from '@/misc/fetch.js';

const logger = new Logger('webhook');

let latest: string | null = null;

export default async (job: Bull.Job<WebhookDeliverJobData>) => {
	try {
		if (latest !== (latest = JSON.stringify(job.data.content, null, 2))) {
			logger.debug(`delivering ${latest}`);
		}

		await getResponse({
			url: job.data.to,
			method: 'POST',
			headers: {},
			body: JSON.stringify(job.data.content),
		});

		return 'Success';
	} catch (res) {
		if (res instanceof StatusError) {
			// 4xx
			if (res.isClientError) {
				// HTTPステータスコード4xxはクライアントエラーであり、それはつまり
				// 何回再送しても成功することはないということなのでエラーにはしないでおく
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
