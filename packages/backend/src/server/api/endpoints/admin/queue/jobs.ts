/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import type { QueueService } from '@/core/QueueService.js';
import { QUEUE_TYPES, } from '@/core/QueueService.js';
import { Endpoint } from '@/server/api/endpoint-base.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,
	kind: 'read:admin:queue',

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			optional: false, nullable: false,
			ref: 'QueueJob',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		queue: { type: 'string', enum: QUEUE_TYPES },
		state: { type: 'array', items: { type: 'string', enum: ['active', 'wait', 'delayed', 'completed', 'failed', 'paused'] } },
		search: { type: 'string' },
	},
	required: ['queue', 'state'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		private queueService: QueueService,
	) {
		super(meta, paramDef, async (ps, me) => {
			return this.queueService.queueGetJobs(ps.queue, ps.state, ps.search);
		});
	}
}
