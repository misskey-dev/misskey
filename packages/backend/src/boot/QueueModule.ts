import Bull from 'bull';
import {
	IServiceCollection,
	addSingletonFactory,
	getRequiredService,
} from 'yohira';
import { Config } from '@/config.js';
import { DI } from '@/di-symbols.js';
import type { DeliverJobData, InboxJobData, DbJobData, ObjectStorageJobData, EndedPollNotificationJobData, WebhookDeliverJobData } from '../queue/types.js';

// ref. https://github.com/misskey-dev/misskey/pull/7635#issue-971097019
function apBackoff(attemptsMade: number/* , err: Error */): number {
	const baseDelay = 60 * 1000;	// 1min
	const maxBackoff = 8 * 60 * 60 * 1000;	// 8hours
	let backoff = (Math.pow(2, attemptsMade) - 1) * baseDelay;
	backoff = Math.min(backoff, maxBackoff);
	backoff += Math.round(backoff * Math.random() * 0.2);
	return backoff;
}

function q<T>(config: Config, name: string, limitPerSec = -1): Bull.Queue {
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

export type SystemQueue = Bull.Queue<Record<string, unknown>>;
export type EndedPollNotificationQueue = Bull.Queue<EndedPollNotificationJobData>;
export type DeliverQueue = Bull.Queue<DeliverJobData>;
export type InboxQueue = Bull.Queue<InboxJobData>;
export type DbQueue = Bull.Queue<DbJobData>;
export type ObjectStorageQueue = Bull.Queue<ObjectStorageJobData>;
export type WebhookDeliverQueue = Bull.Queue<WebhookDeliverJobData>;

export function addQueueServices(services: IServiceCollection): void {
	addSingletonFactory(services, Symbol.for('queue:system'), (services) => {
		const config = getRequiredService<Config>(services, DI.config);
		return q(config, 'system');
	});

	addSingletonFactory(
		services,
		Symbol.for('queue:endedPollNotification'),
		(services) => {
			const config = getRequiredService<Config>(services, DI.config);
			return q(config, 'endedPollNotification');
		},
	);

	addSingletonFactory(services, Symbol.for('queue:deliver'), (services) => {
		const config = getRequiredService<Config>(services, DI.config);
		return q(config, 'deliver', config.deliverJobPerSec ?? 128);
	});

	addSingletonFactory(services, Symbol.for('queue:inbox'), (services) => {
		const config = getRequiredService<Config>(services, DI.config);
		return q(config, 'inbox', config.inboxJobPerSec ?? 16);
	});

	addSingletonFactory(services, Symbol.for('queue:db'), (services) => {
		const config = getRequiredService<Config>(services, DI.config);
		return q(config, 'db');
	});

	addSingletonFactory(
		services,
		Symbol.for('queue:objectStorage'),
		(services) => {
			const config = getRequiredService<Config>(services, DI.config);
			return q(config, 'objectStorage');
		},
	);

	addSingletonFactory(
		services,
		Symbol.for('queue:webhookDeliver'),
		(services) => {
			const config = getRequiredService<Config>(services, DI.config);
			return q(config, 'webhookDeliver', 64);
		},
	);
}
