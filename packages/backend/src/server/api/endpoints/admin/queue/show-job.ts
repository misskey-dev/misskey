/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import * as v from 'valibot';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { QUEUE_TYPES, QueueService } from '@/core/QueueService.js';
import { packedQueueJobSchema } from '@/models/schema/queue.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,
	kind: 'read:admin:queue',

	res: packedQueueJobSchema,
} as const;

export const paramDef = v.object({
	queue: v.picklist([...QUEUE_TYPES]),
	jobId: v.string(),
});

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		private queueService: QueueService,
	) {
		super(meta, paramDef, async (ps, me) => {
			return this.queueService.queueGetJob(ps.queue, ps.jobId);
		});
	}
}
