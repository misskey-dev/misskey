import { deliverQueue, inboxQueue, dbQueue, objectStorageQueue } from '@/queue/queues';
import $ from 'cafy';
import define from '../../../define';

export const meta = {
	desc: {
		'ja-JP': 'ジョブ一覧を表示します。',
		'en-US': 'Display the job list.'
	},

	tags: ['admin'],

	requireCredential: true as const,
	requireModerator: true,

	params: {
		domain: {
			validator: $.str.or(['deliver', 'inbox', 'db', 'objectStorage']),
		},

		state: {
			validator: $.str.or(['active', 'waiting', 'delayed']),
		},

		limit: {
			validator: $.optional.num,
			default: 50
		},
	},

	res: {
		type: 'array' as const,
		optional: false as const, nullable: false as const,
		items: {
			type: 'object' as const,
			optional: false as const, nullable: false as const,
			properties: {
				id: {
					type: 'string' as const,
					optional: false as const, nullable: false as const,
					format: 'id'
				},
				data: {
					type: 'object' as const,
					optional: false as const, nullable: false as const
				},
				attempts: {
					type: 'number' as const,
					optional: false as const, nullable: false as const
				},
				maxAttempts: {
					type: 'number' as const,
					optional: false as const, nullable: false as const
				},
				timestamp: {
					type: 'number' as const,
					optional: false as const, nullable: false as const
				}
			}
		}
	}
};

export default define(meta, async (ps) => {
	const queue =
		ps.domain === 'deliver' ? deliverQueue :
		ps.domain === 'inbox' ? inboxQueue :
		ps.domain === 'db' ? dbQueue :
		ps.domain === 'objectStorage' ? objectStorageQueue :
		null as never;

	const jobs = await queue.getJobs([ps.state], 0, ps.limit!);

	return jobs.map(job => {
		const data = job.data;
		delete data.content;
		delete data.user;
		return {
			id: job.id,
			data,
			attempts: job.attemptsMade,
			maxAttempts: job.opts ? job.opts.attempts : 0,
			timestamp: job.timestamp,
		};
	});
});
