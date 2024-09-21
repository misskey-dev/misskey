/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { IEndpointMeta } from '@/server/api/endpoints.js';
import type { Schema } from '@/misc/json-schema.js';
import { ModerationLogService } from '@/core/ModerationLogService.js';
import { QueueService } from '@/core/QueueService.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,
	kind: 'write:admin:queue',
} as const satisfies IEndpointMeta;

export const paramDef = {
	type: 'object',
	properties: {
		type: { type: 'string', enum: ['deliver', 'inbox'] },
	},
	required: ['type'],
} as const satisfies Schema;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		private moderationLogService: ModerationLogService,
		private queueService: QueueService,
	) {
		super(meta, paramDef, async (ps, me) => {
			let delayedQueues;

			switch (ps.type) {
				case 'deliver':
					delayedQueues = await this.queueService.deliverQueue.getDelayed();
					for (let queueIndex = 0; queueIndex < delayedQueues.length; queueIndex++) {
						const queue = delayedQueues[queueIndex];
						try {
							await queue.promote();
						} catch (e) {
							if (e instanceof Error) {
								if (e.message.indexOf('not in a delayed state') !== -1) {
									throw e;
								}
							} else {
								throw e;
							}
						}
					}
					break;

				case 'inbox':
					delayedQueues = await this.queueService.inboxQueue.getDelayed();
					for (let queueIndex = 0; queueIndex < delayedQueues.length; queueIndex++) {
						const queue = delayedQueues[queueIndex];
						try {
							await queue.promote();
						} catch (e) {
							if (e instanceof Error) {
								if (e.message.indexOf('not in a delayed state') !== -1) {
									throw e;
								}
							} else {
								throw e;
							}
						}
					}
					break;
			}

			this.moderationLogService.log(me, 'promoteQueue');
		});
	}
}
