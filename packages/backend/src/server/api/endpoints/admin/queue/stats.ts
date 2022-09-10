import { deliverQueue, inboxQueue, dbQueue, objectStorageQueue } from '@/queue/queues.js';
import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';

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
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject('notesRepository')
    private notesRepository: typeof Notes,
	) {
		super(meta, paramDef, async (ps, user) => {
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
