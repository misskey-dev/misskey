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

	res: v.array(v.object({
		name: v.picklist([...QUEUE_TYPES]),
		counts: v.record(v.string(), v.number()),
		isPaused: v.boolean(),
		metrics: v.object({
			completed: packedQueueMetricsSchema,
			failed: packedQueueMetricsSchema,
		}),
	})),
} as const;

export const paramDef = v.object({});

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		private queueService: QueueService,
	) {
		super(meta, paramDef, async (ps, me) => {
			return this.queueService.queueGetQueues();
		});
	}
}
