import $ from 'cafy';
import define from '../../../define';
import { deliverQueue, inboxQueue } from '../../../../../queue';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,

	params: {
		domain: {
			validator: $.str,
		},

		state: {
			validator: $.str,
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
		null;

	const jobs = await queue.getJobs([ps.state], 0, ps.limit);

	return jobs.map(job => ({
		id: job.id,
		data: job.data,
		attempts: job.attemptsMade,
	}));
});
