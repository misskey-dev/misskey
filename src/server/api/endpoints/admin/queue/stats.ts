import { deliverQueue, inboxQueue, dbQueue, objectStorageQueue } from '@/queue/queues';
import define from '../../../define';

export const meta = {
	desc: {
		'ja-JP': 'キューの状態を返します。',
		'en-US': 'Returns the status of the queue.'
	},

	tags: ['admin'],

	requireCredential: true as const,
	requireModerator: true,

	params: {},

	res: {
		type: 'object' as const,
		optional: false as const, nullable: false as const,
		properties: {
			deliver: {
				ref: 'QueueCount'
			},
			inbox: {
				ref: 'QueueCount'
			},
			db: {
				ref: 'QueueCount'
			},
			objectStorage: {
				ref: 'QueueCount'
			}
		}
	}
};

export default define(meta, async (ps) => {
	const deliverJobCounts = await deliverQueue.getJobCounts();
	const inboxJobCounts = await inboxQueue.getJobCounts();
	const dbJobCounts = await dbQueue.getJobCounts();
	const objectStorageJobCounts = await objectStorageQueue.getJobCounts();

	return {
		deliver: deliverJobCounts,
		inbox: inboxJobCounts,
		db: dbJobCounts,
		objectStorage: objectStorageJobCounts,
	};
});
