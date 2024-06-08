/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { DbQueue, DeliverQueue, EndedPollNotificationQueue, InboxQueue, ObjectStorageQueue, SystemQueue, UserWebhookDeliverQueue, SystemWebhookDeliverQueue } from '@/core/QueueModule.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,
	kind: 'read:admin:emoji',

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

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject('queue:system') public systemQueue: SystemQueue,
		@Inject('queue:endedPollNotification') public endedPollNotificationQueue: EndedPollNotificationQueue,
		@Inject('queue:deliver') public deliverQueue: DeliverQueue,
		@Inject('queue:inbox') public inboxQueue: InboxQueue,
		@Inject('queue:db') public dbQueue: DbQueue,
		@Inject('queue:objectStorage') public objectStorageQueue: ObjectStorageQueue,
		@Inject('queue:userWebhookDeliver') public userWebhookDeliverQueue: UserWebhookDeliverQueue,
		@Inject('queue:systemWebhookDeliver') public systemWebhookDeliverQueue: SystemWebhookDeliverQueue,
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
