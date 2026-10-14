/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import * as v from 'valibot';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { DbQueue, DeliverQueue, EndedPollNotificationQueue, PostScheduledNoteQueue, InboxQueue, ObjectStorageQueue, SystemQueue, UserWebhookDeliverQueue, SystemWebhookDeliverQueue } from '@/core/QueueModule.js';
import { packedQueueCountSchema } from '@/models/schema/queue.js';
import type { PackedQueueCount } from '@/models/schema/queue.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,
	kind: 'read:admin:queue',

	res: v.object({
		deliver: packedQueueCountSchema,
		inbox: packedQueueCountSchema,
		db: packedQueueCountSchema,
		objectStorage: packedQueueCountSchema,
	}),
} as const;

export const paramDef = v.object({});

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject('queue:system') public systemQueue: SystemQueue,
		@Inject('queue:endedPollNotification') public endedPollNotificationQueue: EndedPollNotificationQueue,
		@Inject('queue:postScheduledNote') public postScheduledNoteQueue: PostScheduledNoteQueue,
		@Inject('queue:deliver') public deliverQueue: DeliverQueue,
		@Inject('queue:inbox') public inboxQueue: InboxQueue,
		@Inject('queue:db') public dbQueue: DbQueue,
		@Inject('queue:objectStorage') public objectStorageQueue: ObjectStorageQueue,
		@Inject('queue:userWebhookDeliver') public userWebhookDeliverQueue: UserWebhookDeliverQueue,
		@Inject('queue:systemWebhookDeliver') public systemWebhookDeliverQueue: SystemWebhookDeliverQueue,
	) {
		super(meta, paramDef, async (ps, me) => {
			// bullmq の getJobCounts() は要求可能な全 JobType をキーに持つ index signature 型を返し、
			// res スキーマが宣言する 5 キーより広い (レスポンスにも余分なキーがそのまま含まれ得る)。
			// legacy スキーマでは res の型が any に潰れていたため見えなかった相違で、
			// ランタイム挙動を変えないようキャストで従来どおりの返却形を維持する。
			const deliverJobCounts = await this.deliverQueue.getJobCounts() as PackedQueueCount;
			const inboxJobCounts = await this.inboxQueue.getJobCounts() as PackedQueueCount;
			const dbJobCounts = await this.dbQueue.getJobCounts() as PackedQueueCount;
			const objectStorageJobCounts = await this.objectStorageQueue.getJobCounts() as PackedQueueCount;

			return {
				deliver: deliverJobCounts,
				inbox: inboxJobCounts,
				db: dbJobCounts,
				objectStorage: objectStorageJobCounts,
			};
		});
	}
}
