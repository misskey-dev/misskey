/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { ModerationLogService } from '@/core/ModerationLogService.js';
import { QueueService } from '@/core/QueueService.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,
} as const;

export const paramDef = {
	type: 'object',
	properties: {},
	required: [],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		private moderationLogService: ModerationLogService,
		private queueService: QueueService,
	) {
		super(meta, paramDef, async (ps, me) => {
			this.queueService.destroy();

			this.moderationLogService.log(me, 'clearQueue');
		});
	}
}
