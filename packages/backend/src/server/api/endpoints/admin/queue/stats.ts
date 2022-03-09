import { deliverQueue, inboxQueue, dbQueue, objectStorageQueue } from '@/queue/queues.js';
import define from '../../../define.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,

	res: {
		type: 'object',
		optional: false, nullable: false,
		properties: {
			deliver: {
				optional: false, nullable: false,
				ref: 'QueueCount',
			},
			inbox: {
				optional: false, nullable: false,
				ref: 'QueueCount',
			},
			db: {
				optional: false, nullable: false,
				ref: 'QueueCount',
			},
			objectStorage: {
				optional: false, nullable: false,
				ref: 'QueueCount',
			},
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {},
	required: [],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps) => {
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
