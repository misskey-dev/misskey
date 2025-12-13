/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import type { ModerationLogService } from '@/core/ModerationLogService.js';
import type { QueueService } from '@/core/QueueService.js';
import { QUEUE_TYPES, } from '@/core/QueueService.js';
import { Endpoint } from '@/server/api/endpoint-base.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,
	kind: 'write:admin:queue',
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		queue: { type: 'string', enum: QUEUE_TYPES },
		state: { type: 'string', enum: ['*', 'completed', 'wait', 'active', 'paused', 'prioritized', 'delayed', 'failed'] },
	},
	required: ['queue', 'state'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		private moderationLogService: ModerationLogService,
		private queueService: QueueService,
	) {
		super(meta, paramDef, async (ps, me) => {
			this.queueService.queueClear(ps.queue, ps.state);

			this.moderationLogService.log(me, 'clearQueue');
		});
	}
}
