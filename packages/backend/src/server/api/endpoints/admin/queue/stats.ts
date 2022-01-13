import { deliverQueue, inboxQueue, dbQueue, objectStorageQueue } from '@/queue/queues';
import define from '../../../define';

export const meta = {
	tags: ['admin'],

	requireCredential: true as const,
	requireModerator: true,

	params: {},

	res: {
		type: 'object' as const,
		optional: false as const, nullable: false as const,
		properties: {
			deliver: {
				type: 'object' as const,
				optional: false as const, nullable: false as const,
				ref: 'QueueCount' as const,
			},
			inbox: {
				type: 'object' as const,
				optional: false as const, nullable: false as const,
				ref: 'QueueCount' as const,
			},
			db: {
				type: 'object' as const,
				optional: false as const, nullable: false as const,
				ref: 'QueueCount' as const,
			},
			objectStorage: {
				type: 'object' as const,
				optional: false as const, nullable: false as const,
				ref: 'QueueCount' as const,
			},
		},
	},
};

// eslint-disable-next-line import/no-default-export
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
