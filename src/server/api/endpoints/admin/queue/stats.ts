import define from '../../../define';
import { deliverQueue } from '../../../../../queue';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,

	params: {}
};

export default define(meta, async (ps) => {
	const deliverJobCounts = await deliverQueue.getJobCounts();
	const inboxJobCounts = await deliverQueue.getJobCounts();

	return {
		deliver: deliverJobCounts,
		inbox: inboxJobCounts
	};
});
