import { deliverQueue, inboxQueue, dbQueue, objectStorageQueue } from '@/queue/queues';
import $ from 'cafy';
import define from '../../../define';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
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
			default: 50,
		},
	},

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'object',
			optional: false, nullable: false,
			properties: {
				id: {
					type: 'string',
					optional: false, nullable: false,
					format: 'id',
				},
				data: {
					type: 'object',
					optional: false, nullable: false,
				},
				attempts: {
					type: 'number',
					optional: false, nullable: false,
				},
				maxAttempts: {
					type: 'number',
					optional: false, nullable: false,
				},
				timestamp: {
					type: 'number',
					optional: false, nullable: false,
				},
			},
		},
	},
} as const;

// eslint-disable-next-line import/no-default-export
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
