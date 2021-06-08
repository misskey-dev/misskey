import { deliverQueue } from '@/queue/queues';
import { URL } from 'url';
import define from '../../../define';

export const meta = {
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
		},
		example: [[
			'example.com',
			12
		]]
	}
};

export default define(meta, async (ps) => {
	const jobs = await deliverQueue.getJobs(['delayed']);

	const res = [] as [string, number][];

	for (const job of jobs) {
		const host = new URL(job.data.to).host;
		if (res.find(x => x[0] === host)) {
			res.find(x => x[0] === host)![1]++;
		} else {
			res.push([host, 1]);
		}
	}

	res.sort((a, b) => b[1] - a[1]);

	return res;
});
