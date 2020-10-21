import define from '../../../define';
import { inboxQueue } from '../../../../../queue';

export const meta = {
	desc: {
		'ja-JP': 'このサーバーへのキューの遅延一覧を返します。',
		'en-US': 'Returns a list of queue delays to this server.'
	},

	tags: ['admin'],

	requireCredential: true as const,
	requireModerator: true,

	params: {
	},

	res: {
		type: 'array' as const,
		optional: false as const, nullable: false as const,
		items: {
			type: 'array' as const,
			optional: false as const, nullable: false as const,
			items: {
				anyOf: [
					{
						type: 'string' as const,
						description: 'FQDN to fediverse server'
					},
					{
						type: 'number' as const,
						description: 'Delayed queue counts'
					}
				]
			}
		}
	}
};

export default define(meta, async (ps) => {
	const jobs = await inboxQueue.getJobs(['delayed']);

	const res = [] as [string, number][];

	for (const job of jobs) {
		const host = new URL(job.data.signature.keyId).host;
		if (res.find(x => x[0] === host)) {
			res.find(x => x[0] === host)![1]++;
		} else {
			res.push([host, 1]);
		}
	}

	res.sort((a, b) => b[1] - a[1]);

	return res;
});
