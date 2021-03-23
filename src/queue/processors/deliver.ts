import * as Bull from 'bull';
import request from '../../remote/activitypub/request';
import { registerOrFetchInstanceDoc } from '../../services/register-or-fetch-instance-doc';
import Logger from '../../services/logger';
import { Instances } from '../../models';
import { instanceChart } from '../../services/chart';
import { fetchInstanceMetadata } from '../../services/fetch-instance-metadata';
import { fetchMeta } from '@/misc/fetch-meta';
import { toPuny } from '@/misc/convert-host';
import { Cache } from '@/misc/cache';
import { Instance } from '../../models/entities/instance';

const logger = new Logger('deliver');

let latest: string | null = null;

const suspendedHostsCache = new Cache<Instance[]>(1000 * 60 * 60);

export default async (job: Bull.Job) => {
	const { host } = new URL(job.data.to);

	// ブロックしてたら中断
	const meta = await fetchMeta();
	if (meta.blockedHosts.includes(toPuny(host))) {
		return 'skip (blocked)';
	}

	// isSuspendedなら中断
	let suspendedHosts = suspendedHostsCache.get(null);
	if (suspendedHosts == null) {
		suspendedHosts = await Instances.find({
			where: {
				isSuspended: true
			},
		});
		suspendedHostsCache.set(null, suspendedHosts);
	}
	if (suspendedHosts.map(x => x.host).includes(toPuny(host))) {
		return 'skip (suspended)';
	}

	try {
		if (latest !== (latest = JSON.stringify(job.data.content, null, 2))) {
			logger.debug(`delivering ${latest}`);
		}

		await request(job.data.user, job.data.to, job.data.content);

		// Update stats
		registerOrFetchInstanceDoc(host).then(i => {
			Instances.update(i.id, {
				latestRequestSentAt: new Date(),
				latestStatus: 200,
				lastCommunicatedAt: new Date(),
				isNotResponding: false
			});

			fetchInstanceMetadata(i);

			instanceChart.requestSent(i.host, true);
		});

		return 'Success';
	} catch (res) {
		// Update stats
		registerOrFetchInstanceDoc(host).then(i => {
			Instances.update(i.id, {
				latestRequestSentAt: new Date(),
				latestStatus: res != null && res.hasOwnProperty('statusCode') ? res.statusCode : null,
				isNotResponding: true
			});

			instanceChart.requestSent(i.host, false);
		});

		if (res != null && res.hasOwnProperty('statusCode')) {
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
			throw res;
		}
	}
};
