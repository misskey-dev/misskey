/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Module, OnApplicationShutdown } from '@nestjs/common';
import * as Bull from 'bullmq';
import { DI } from '@/di-symbols.js';
import type { Config } from '@/config.js';
import { QUEUE, baseQueueOptions } from '@/queue/const.js';
import { allSettled } from '@/misc/promise-tracker.js';
import { Queues } from '@/misc/queues.js';
import type { Provider } from '@nestjs/common';
import type { DeliverJobData, InboxJobData, EndedPollNotificationJobData, WebhookDeliverJobData, RelationshipJobData } from '../queue/types.js';

export type SystemQueue = Bull.Queue<Record<string, unknown>>;
export type EndedPollNotificationQueue = Bull.Queue<EndedPollNotificationJobData>;
export type DeliverQueue = Queues<DeliverJobData>;
export type InboxQueue = Queues<InboxJobData>;
export type DbQueue = Bull.Queue;
export type RelationshipQueue = Queues<RelationshipJobData>;
export type ObjectStorageQueue = Bull.Queue;
export type WebhookDeliverQueue = Bull.Queue<WebhookDeliverJobData>;

const $system: Provider = {
	provide: 'queue:system',
	useFactory: (config: Config) => new Bull.Queue(QUEUE.SYSTEM, baseQueueOptions(config.redisForSystemQueue, config.bullmqQueueOptions, QUEUE.SYSTEM)),
	inject: [DI.config],
};

const $endedPollNotification: Provider = {
	provide: 'queue:endedPollNotification',
	useFactory: (config: Config) => new Bull.Queue(QUEUE.ENDED_POLL_NOTIFICATION, baseQueueOptions(config.redisForEndedPollNotificationQueue, config.bullmqQueueOptions, QUEUE.ENDED_POLL_NOTIFICATION)),
	inject: [DI.config],
};

const $deliver: Provider = {
	provide: 'queue:deliver',
	useFactory: (config: Config) => new Queues(config.redisForDeliverQueues.map(queueConfig => new Bull.Queue(QUEUE.DELIVER, baseQueueOptions(queueConfig, config.bullmqQueueOptions, QUEUE.DELIVER)))),
	inject: [DI.config],
};

const $inbox: Provider = {
	provide: 'queue:inbox',
	useFactory: (config: Config) => new Queues(config.redisForInboxQueues.map(queueConfig => new Bull.Queue(QUEUE.INBOX, baseQueueOptions(queueConfig, config.bullmqQueueOptions, QUEUE.INBOX)))),
	inject: [DI.config],
};

const $db: Provider = {
	provide: 'queue:db',
	useFactory: (config: Config) => new Bull.Queue(QUEUE.DB, baseQueueOptions(config.redisForDbQueue, config.bullmqQueueOptions, QUEUE.DB)),
	inject: [DI.config],
};

const $relationship: Provider = {
	provide: 'queue:relationship',
	useFactory: (config: Config) => new Queues(config.redisForRelationshipQueues.map(queueConfig => new Bull.Queue(QUEUE.RELATIONSHIP, baseQueueOptions(queueConfig, config.bullmqQueueOptions, QUEUE.RELATIONSHIP)))),
	inject: [DI.config],
};

const $objectStorage: Provider = {
	provide: 'queue:objectStorage',
	useFactory: (config: Config) => new Bull.Queue(QUEUE.OBJECT_STORAGE, baseQueueOptions(config.redisForObjectStorageQueue, config.bullmqQueueOptions, QUEUE.OBJECT_STORAGE)),
	inject: [DI.config],
};

const $webhookDeliver: Provider = {
	provide: 'queue:webhookDeliver',
	useFactory: (config: Config) => new Bull.Queue(QUEUE.WEBHOOK_DELIVER, baseQueueOptions(config.redisForWebhookDeliverQueue, config.bullmqQueueOptions, QUEUE.WEBHOOK_DELIVER)),
	inject: [DI.config],
};

@Module({
	imports: [
	],
	providers: [
		$system,
		$endedPollNotification,
		$deliver,
		$inbox,
		$db,
		$relationship,
		$objectStorage,
		$webhookDeliver,
	],
	exports: [
		$system,
		$endedPollNotification,
		$deliver,
		$inbox,
		$db,
		$relationship,
		$objectStorage,
		$webhookDeliver,
	],
})
export class QueueModule implements OnApplicationShutdown {
	constructor(
		@Inject('queue:system') public systemQueue: SystemQueue,
		@Inject('queue:endedPollNotification') public endedPollNotificationQueue: EndedPollNotificationQueue,
		@Inject('queue:deliver') public deliverQueue: DeliverQueue,
		@Inject('queue:inbox') public inboxQueue: InboxQueue,
		@Inject('queue:db') public dbQueue: DbQueue,
		@Inject('queue:relationship') public relationshipQueue: RelationshipQueue,
		@Inject('queue:objectStorage') public objectStorageQueue: ObjectStorageQueue,
		@Inject('queue:webhookDeliver') public webhookDeliverQueue: WebhookDeliverQueue,
	) {}

	public async dispose(): Promise<void> {
		// Wait for all potential queue jobs
		await allSettled();
		// And then close all queues
		await Promise.all([
			this.systemQueue.close(),
			this.endedPollNotificationQueue.close(),
			this.deliverQueue.close(),
			this.inboxQueue.close(),
			this.dbQueue.close(),
			this.relationshipQueue.close(),
			this.objectStorageQueue.close(),
			this.webhookDeliverQueue.close(),
		]);
	}

	async onApplicationShutdown(signal: string): Promise<void> {
		await this.dispose();
	}
}
