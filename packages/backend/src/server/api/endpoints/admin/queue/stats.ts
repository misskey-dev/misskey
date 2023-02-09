import { Inject, Injectable } from '@/di-decorators.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { DbQueue, DeliverQueue, EndedPollNotificationQueue, InboxQueue, ObjectStorageQueue, SystemQueue, WebhookDeliverQueue } from '@/core/QueueModule.js';

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
		@Inject(Symbol.for('queue:system')) public systemQueue: SystemQueue,
		@Inject(Symbol.for('queue:endedPollNotification')) public endedPollNotificationQueue: EndedPollNotificationQueue,
		@Inject(Symbol.for('queue:deliver')) public deliverQueue: DeliverQueue,
		@Inject(Symbol.for('queue:inbox')) public inboxQueue: InboxQueue,
		@Inject(Symbol.for('queue:db')) public dbQueue: DbQueue,
		@Inject(Symbol.for('queue:objectStorage')) public objectStorageQueue: ObjectStorageQueue,
		@Inject(Symbol.for('queue:webhookDeliver')) public webhookDeliverQueue: WebhookDeliverQueue,
	) {
		super(meta, paramDef, async (ps, me) => {
			const deliverJobCounts = await this.deliverQueue.getJobCounts();
			const inboxJobCounts = await this.inboxQueue.getJobCounts();
			const dbJobCounts = await this.dbQueue.getJobCounts();
			const objectStorageJobCounts = await this.objectStorageQueue.getJobCounts();

			return {
				deliver: deliverJobCounts,
				inbox: inboxJobCounts,
				db: dbJobCounts,
				objectStorage: objectStorageJobCounts,
			};
		});
	}
}
