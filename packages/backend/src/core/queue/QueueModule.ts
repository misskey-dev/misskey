import { Module } from '@nestjs/common';
import Bull from 'bull';
import { DI } from '@/di-symbols.js';
import type { Config } from '@/config.js';
import type { Provider } from '@nestjs/common';
import type { DeliverJobData, InboxJobData, DbJobData, ObjectStorageJobData, EndedPollNotificationJobData, WebhookDeliverJobData } from '../../queue/types.js';

function q<T>(config: Config, name: string, limitPerSec = -1) {
	return new Bull<T>(name, {
		redis: {
			port: config.redis.port,
			host: config.redis.host,
			family: config.redis.family == null ? 0 : config.redis.family,
			password: config.redis.pass,
			db: config.redis.db ?? 0,
		},
		prefix: config.redis.prefix ? `${config.redis.prefix}:queue` : 'queue',
		limiter: limitPerSec > 0 ? {
			max: limitPerSec,
			duration: 1000,
		} : undefined,
		settings: {
			backoffStrategies: {
				apBackoff,
			},
		},
	});
}

// ref. https://github.com/misskey-dev/misskey/pull/7635#issue-971097019
function apBackoff(attemptsMade: number, err: Error) {
	const baseDelay = 60 * 1000;	// 1min
	const maxBackoff = 8 * 60 * 60 * 1000;	// 8hours
	let backoff = (Math.pow(2, attemptsMade) - 1) * baseDelay;
	backoff = Math.min(backoff, maxBackoff);
	backoff += Math.round(backoff * Math.random() * 0.2);
	return backoff;
}

export type SystemQueue = Bull.Queue<Record<string, unknown>>;
export type EndedPollNotificationQueue = Bull.Queue<EndedPollNotificationJobData>;
export type DeliverQueue = Bull.Queue<DeliverJobData>;
export type InboxQueue = Bull.Queue<InboxJobData>;
export type DbQueue = Bull.Queue<DbJobData>;
export type ObjectStorageQueue = Bull.Queue<ObjectStorageJobData>;
export type WebhookDeliverQueue = Bull.Queue<WebhookDeliverJobData>;

const $system: Provider = {
	provide: 'queue:system',
	useFactory: (config: Config) => q(config, 'system'),
	inject: [DI.config],
};

const $endedPollNotification: Provider = {
	provide: 'queue:endedPollNotification',
	useFactory: (config: Config) => q(config, 'endedPollNotification'),
	inject: [DI.config],
};

const $deliver: Provider = {
	provide: 'queue:deliver',
	useFactory: (config: Config) => q(config, 'deliver', config.deliverJobPerSec ?? 128),
	inject: [DI.config],
};

const $inbox: Provider = {
	provide: 'queue:inbox',
	useFactory: (config: Config) => q(config, 'inbox', config.inboxJobPerSec ?? 16),
	inject: [DI.config],
};

const $db: Provider = {
	provide: 'queue:db',
	useFactory: (config: Config) => q(config, 'db'),
	inject: [DI.config],
};

const $objectStorage: Provider = {
	provide: 'queue:objectStorage',
	useFactory: (config: Config) => q(config, 'objectStorage'),
	inject: [DI.config],
};

const $webhookDeliver: Provider = {
	provide: 'queue:webhookDeliver',
	useFactory: (config: Config) => q(config, 'webhookDeliver', 64),
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
		$objectStorage,
		$webhookDeliver,
	],
	exports: [
		$system,
		$endedPollNotification,
		$deliver,
		$inbox,
		$db,
		$objectStorage,
		$webhookDeliver,
	],
})
export class QueueModule {}
