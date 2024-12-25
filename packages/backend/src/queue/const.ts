/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type * as Bull from 'bullmq';
import type { RedisOptions } from 'ioredis';
import type { RedisOptionsSource } from '@/config.js';

export const QUEUE = {
	DELIVER: 'deliver',
	INBOX: 'inbox',
	SYSTEM: 'system',
	ENDED_POLL_NOTIFICATION: 'endedPollNotification',
	DB: 'db',
	RELATIONSHIP: 'relationship',
	OBJECT_STORAGE: 'objectStorage',
	WEBHOOK_DELIVER: 'webhookDeliver',
};

export function formatQueueName(config: RedisOptionsSource, queueName: typeof QUEUE[keyof typeof QUEUE]): string {
	return typeof config.queueNameSuffix === 'string' ? `${queueName}-${config.queueNameSuffix}` : queueName;
}

export function baseQueueOptions(config: RedisOptions & RedisOptionsSource, queueOptions: Partial<Bull.QueueOptions>, queueName: typeof QUEUE[keyof typeof QUEUE]): Bull.QueueOptions {
	const name = formatQueueName(config, queueName);
	return {
		...queueOptions,
		connection: {
			...config,
			maxRetriesPerRequest: null,
			keyPrefix: undefined,
			reconnectOnError: (err: Error) => {
				if ( err.message.includes('READONLY')
					|| err.message.includes('ETIMEDOUT')
					|| err.message.includes('Command timed out')
				) return 2;
				return 1;
			},
		},
		prefix: config.prefix ? `{${config.prefix}:queue:${name}}` : `{queue:${name}}`,
	};
}

export function baseWorkerOptions(config: RedisOptions & RedisOptionsSource, workerOptions: Partial<Bull.WorkerOptions>, queueName: typeof QUEUE[keyof typeof QUEUE]): Bull.WorkerOptions {
	const name = formatQueueName(config, queueName);
	return {
		...workerOptions,
		connection: {
			...config,
			maxRetriesPerRequest: null,
			keyPrefix: undefined,
			reconnectOnError: (err: Error) => {
				if ( err.message.includes('READONLY')
					|| err.message.includes('ETIMEDOUT')
					|| err.message.includes('Command timed out')
				) return 2;
				return 1;
			},
		},
		prefix: config.prefix ? `{${config.prefix}:queue:${name}}` : `{queue:${name}}`,
	};
}
