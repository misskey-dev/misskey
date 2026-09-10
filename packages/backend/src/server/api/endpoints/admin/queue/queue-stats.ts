/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import * as v from 'valibot';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { QUEUE_TYPES, QueueService } from '@/core/QueueService.js';
import { packedQueueMetricsSchema } from '@/models/schema/queue.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,
	kind: 'read:admin:queue',

	res: v.object({
		name: v.picklist([...QUEUE_TYPES]),
		qualifiedName: v.string(),
		counts: v.record(v.string(), v.number()),
		isPaused: v.boolean(),
		metrics: v.object({
			completed: packedQueueMetricsSchema,
			failed: packedQueueMetricsSchema,
		}),
		db: v.object({
			version: v.string(),
			mode: v.picklist(['cluster', 'standalone', 'sentinel']),
			runId: v.string(),
			processId: v.string(),
			port: v.number(),
			os: v.string(),
			uptime: v.number(),
			memory: v.object({
				total: v.number(),
				used: v.number(),
				fragmentationRatio: v.number(),
				peak: v.number(),
			}),
			clients: v.object({
				blocked: v.number(),
				connected: v.number(),
			}),
		}),
	}),
} as const;

export const paramDef = v.object({
	queue: v.picklist([...QUEUE_TYPES]),
});

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		private queueService: QueueService,
	) {
		super(meta, paramDef, async (ps, me) => {
			return this.queueService.queueGetQueue(ps.queue);
		});
	}
}
