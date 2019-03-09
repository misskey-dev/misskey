import * as Bull from 'bull';
import request from '../../remote/activitypub/request';
import { registerOrFetchInstanceDoc } from '../../services/register-or-fetch-instance-doc';
import Instance from '../../models/instance';
import instanceChart from '../../services/chart/instance';
import Logger from '../../services/logger';

const logger = new Logger('deliver');

let latest: string = null;

export default async (job: Bull.Job) => {
	const { host } = new URL(job.data.to);

	try {
		if (latest !== (latest = JSON.stringify(job.data.content, null, 2))) {
			logger.debug(`delivering ${latest}`);
		}

		await request(job.data.user, job.data.to, job.data.content);

		// Update stats
		registerOrFetchInstanceDoc(host).then(i => {
			Instance.update({ _id: i._id }, {
				$set: {
					latestRequestSentAt: new Date(),
					latestStatus: 200,
					lastCommunicatedAt: new Date(),
					isNotResponding: false
				}
			});

			instanceChart.requestSent(i.host, true);
		});

		return 'Success';
	} catch (res) {
		// Update stats
		registerOrFetchInstanceDoc(host).then(i => {
			Instance.update({ _id: i._id }, {
				$set: {
					latestRequestSentAt: new Date(),
					latestStatus: res != null && res.hasOwnProperty('statusCode') ? res.statusCode : null,
					isNotResponding: true
				}
			});

			instanceChart.requestSent(i.host, false);
		});

		if (res != null && res.hasOwnProperty('statusCode')) {
			logger.warn(`deliver failed: ${res.statusCode} ${res.statusMessage} to=${job.data.to}`);

			// 4xx
			if (res.statusCode >= 400 && res.statusCode < 500) {
				// HTTPステータスコード4xxはクライアントエラーであり、それはつまり
				// 何回再送しても成功することはないということなのでエラーにはしないでおく
				return `${res.statusCode} ${res.statusMessage}`;
			}

			// 5xx etc.
			throw `${res.statusCode} ${res.statusMessage}`;
		} else {
			// DNS error, socket error, timeout ...
			logger.warn(`deliver failed: ${res} to=${job.data.to}`);
			throw res;
		}
	}
};
