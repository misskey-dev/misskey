/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Module, OnApplicationShutdown } from '@nestjs/common';
import * as Bull from 'bullmq';
import { DI } from '@/di-symbols.js';
import type { Config } from '@/config.js';
import { baseQueueOptions, QUEUE } from '@/queue/const.js';
import { allSettled } from '@/misc/promise-tracker.js';
import { instrumentQueue } from '@/core/telemetry/queue-instrumentation.js';
import {
	DeliverJobData,
	EndedPollNotificationJobData,
	InboxJobData,
	RelationshipJobData,
	UserWebhookDeliverJobData,
	SystemWebhookDeliverJobData,
	PostScheduledNoteJobData,
} from '../queue/types.js';
import type { Provider } from '@nestjs/common';

export type SystemQueue = Bull.Queue<Record<string, unknown>>;
export type EndedPollNotificationQueue = Bull.Queue<EndedPollNotificationJobData>;
export type PostScheduledNoteQueue = Bull.Queue<PostScheduledNoteJobData>;
export type DeliverQueue = Bull.Queue<DeliverJobData>;
export type InboxQueue = Bull.Queue<InboxJobData>;
export type DbQueue = Bull.Queue;
export type RelationshipQueue = Bull.Queue<RelationshipJobData>;
export type ObjectStorageQueue = Bull.Queue;
export type UserWebhookDeliverQueue = Bull.Queue<UserWebhookDeliverJobData>;
export type SystemWebhookDeliverQueue = Bull.Queue<SystemWebhookDeliverJobData>;

function createQueue<T extends object>(queueName: string, config: Config): Bull.Queue<T> {
	const queue = new Bull.Queue<T>(queueName, baseQueueOptions(config, queueName));
	// Queue のラップは、enqueue 時に OTel context をジョブデータへ埋め込むためのもの。
	// Sentry 単独ではジョブ間の context 伝播を使わないので、OTel 未設定時は元の Queue を返す。
	if (config.otelForBackend == null) return queue;

	return instrumentQueue(queue);
}

const $system: Provider = {
	provide: 'queue:system',
	useFactory: (config: Config) => createQueue<Record<string, unknown>>(QUEUE.SYSTEM, config),
	inject: [DI.config],
};

const $endedPollNotification: Provider = {
	provide: 'queue:endedPollNotification',
	useFactory: (config: Config) => createQueue<EndedPollNotificationJobData>(QUEUE.ENDED_POLL_NOTIFICATION, config),
	inject: [DI.config],
};

const $postScheduledNote: Provider = {
	provide: 'queue:postScheduledNote',
	useFactory: (config: Config) => createQueue<PostScheduledNoteJobData>(QUEUE.POST_SCHEDULED_NOTE, config),
	inject: [DI.config],
};

const $deliver: Provider = {
	provide: 'queue:deliver',
	useFactory: (config: Config) => createQueue<DeliverJobData>(QUEUE.DELIVER, config),
	inject: [DI.config],
};

const $inbox: Provider = {
	provide: 'queue:inbox',
	useFactory: (config: Config) => createQueue<InboxJobData>(QUEUE.INBOX, config),
	inject: [DI.config],
};

const $db: Provider = {
	provide: 'queue:db',
	useFactory: (config: Config) => createQueue<Record<string, unknown>>(QUEUE.DB, config),
	inject: [DI.config],
};

const $relationship: Provider = {
	provide: 'queue:relationship',
	useFactory: (config: Config) => createQueue<RelationshipJobData>(QUEUE.RELATIONSHIP, config),
	inject: [DI.config],
};

const $objectStorage: Provider = {
	provide: 'queue:objectStorage',
	useFactory: (config: Config) => createQueue<Record<string, unknown>>(QUEUE.OBJECT_STORAGE, config),
	inject: [DI.config],
};

const $userWebhookDeliver: Provider = {
	provide: 'queue:userWebhookDeliver',
	useFactory: (config: Config) => createQueue<UserWebhookDeliverJobData>(QUEUE.USER_WEBHOOK_DELIVER, config),
	inject: [DI.config],
};

const $systemWebhookDeliver: Provider = {
	provide: 'queue:systemWebhookDeliver',
	useFactory: (config: Config) => createQueue<SystemWebhookDeliverJobData>(QUEUE.SYSTEM_WEBHOOK_DELIVER, config),
	inject: [DI.config],
};

@Module({
	imports: [
	],
	providers: [
		$system,
		$endedPollNotification,
		$postScheduledNote,
		$deliver,
		$inbox,
		$db,
		$relationship,
		$objectStorage,
		$userWebhookDeliver,
		$systemWebhookDeliver,
	],
	exports: [
		$system,
		$endedPollNotification,
		$postScheduledNote,
		$deliver,
		$inbox,
		$db,
		$relationship,
		$objectStorage,
		$userWebhookDeliver,
		$systemWebhookDeliver,
	],
})
export class QueueModule implements OnApplicationShutdown {
	constructor(
		@Inject('queue:system') public systemQueue: SystemQueue,
		@Inject('queue:endedPollNotification') public endedPollNotificationQueue: EndedPollNotificationQueue,
		@Inject('queue:postScheduledNote') public postScheduledNoteQueue: PostScheduledNoteQueue,
		@Inject('queue:deliver') public deliverQueue: DeliverQueue,
		@Inject('queue:inbox') public inboxQueue: InboxQueue,
		@Inject('queue:db') public dbQueue: DbQueue,
		@Inject('queue:relationship') public relationshipQueue: RelationshipQueue,
		@Inject('queue:objectStorage') public objectStorageQueue: ObjectStorageQueue,
		@Inject('queue:userWebhookDeliver') public userWebhookDeliverQueue: UserWebhookDeliverQueue,
		@Inject('queue:systemWebhookDeliver') public systemWebhookDeliverQueue: SystemWebhookDeliverQueue,
	) {}

	public async dispose(): Promise<void> {
		// Wait for all potential queue jobs
		await allSettled();
		// And then close all queues
		await Promise.all([
			this.systemQueue.close(),
			this.endedPollNotificationQueue.close(),
			this.postScheduledNoteQueue.close(),
			this.deliverQueue.close(),
			this.inboxQueue.close(),
			this.dbQueue.close(),
			this.relationshipQueue.close(),
			this.objectStorageQueue.close(),
			this.userWebhookDeliverQueue.close(),
			this.systemWebhookDeliverQueue.close(),
		]);
	}

	async onApplicationShutdown(signal: string): Promise<void> {
		await this.dispose();
	}
}
