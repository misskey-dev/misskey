import { Module } from '@nestjs/common';
import { DI_SYMBOLS } from '@/di-symbols.js';
import type { Config } from '@/config.js';
import { initialize as initializeQueue } from './initialize.js';
import type Bull from 'bull';
import type { DeliverJobData, InboxJobData, DbJobData, ObjectStorageJobData, EndedPollNotificationJobData, WebhookDeliverJobData } from './types.js';

export type SystemQueue = Bull.Queue<Record<string, unknown>>;
export type EndedPollNotificationQueue = Bull.Queue<EndedPollNotificationJobData>;
export type DeliverQueue = Bull.Queue<DeliverJobData>;
export type InboxQueue = Bull.Queue<InboxJobData>;
export type DbQueue = Bull.Queue<DbJobData>;
export type ObjectStorageQueue = Bull.Queue<ObjectStorageJobData>;
export type WebhookDeliverQueue = Bull.Queue<WebhookDeliverJobData>;

@Module({
	imports: [
	],
	providers: [
		{ provide: 'queue:system', useValue: initializeQueue('system') },
		{ provide: 'queue:endedPollNotification', useValue: initializeQueue('endedPollNotification') },
		{ provide: 'queue:deliver', useFactory: (config: Config) => initializeQueue('deliver', config.deliverJobPerSec ?? 128), inject: [DI_SYMBOLS.config] },
		{ provide: 'queue:inbox', useFactory: (config: Config) => initializeQueue('inbox', config.inboxJobPerSec ?? 16), inject: [DI_SYMBOLS.config] },
		{ provide: 'queue:db', useValue: initializeQueue('db') },
		{ provide: 'queue:objectStorage', useValue: initializeQueue('objectStorage') },
		{ provide: 'queue:webhookDeliver', useValue: initializeQueue('webhookDeliver', 64) },
	],
})
export class QueueModule {}
