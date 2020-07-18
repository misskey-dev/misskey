import $ from 'cafy';
import define from '../../../define';
import { deliverQueue, inboxQueue, dbQueue, objectStorageQueue } from '../../../../../queue';

export const meta = {
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
