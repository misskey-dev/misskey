import define from '../../../define';
import { deliverQueue, inboxQueue } from '../../../../../queue';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,

	params: {}
};

export default define(meta, async (ps) => {
	const deliverJobCounts = await deliverQueue.getJobCounts();
	const inboxJobCounts = await inboxQueue.getJobCounts();

	return {
		deliver: deliverJobCounts,
		inbox: inboxJobCounts
	};
});
