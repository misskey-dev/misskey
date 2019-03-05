import * as bq from 'bee-queue';

import request from '../../../remote/activitypub/request';
import { queueLogger } from '../../logger';
import { registerOrFetchInstanceDoc } from '../../../services/register-or-fetch-instance-doc';
import Instance from '../../../models/instance';
import instanceChart from '../../../services/chart/instance';

let latest: string = null;

export default async (job: bq.Job, done: any): Promise<void> => {
	const { host } = new URL(job.data.to);

	try {
		if (latest !== (latest = JSON.stringify(job.data.content, null, 2)))
			queueLogger.debug(`delivering ${latest}`);

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

		done();
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
			queueLogger.warn(`deliver failed: ${res.statusCode} ${res.statusMessage} to=${job.data.to}`);

			if (res.statusCode >= 400 && res.statusCode < 500) {
				// HTTPステータスコード4xxはクライアントエラーであり、それはつまり
				// 何回再送しても成功することはないということなのでエラーにはしないでおく
				done();
			} else {
				done(res.statusMessage);
			}
		} else {
			queueLogger.warn(`deliver failed: ${res} to=${job.data.to}`);
			done();
		}
	}
};
