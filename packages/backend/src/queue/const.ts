/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type * as Bull from 'bullmq';
import type { RedisOptions } from "ioredis";
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

export function baseQueueOptions(config: RedisOptions & RedisOptionsSource, queueName: typeof QUEUE[keyof typeof QUEUE]): Bull.QueueOptions {
	return {
		connection: {
			...config,
			maxRetriesPerRequest: null,
			keyPrefix: undefined,
		},
		prefix: config.prefix ? `${config.prefix}:queue:${queueName}` : `queue:${queueName}`,
	};
}
