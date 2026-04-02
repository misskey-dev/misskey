/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { QUEUE_TYPES, QueueService } from '@/core/QueueService.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,
	kind: 'read:admin:queue',

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'object',
			optional: false, nullable: false,
			properties: {
				name: {
					type: 'string',
					optional: false, nullable: false,
					enum: QUEUE_TYPES,
				},
				counts: {
					type: 'object',
					optional: false, nullable: false,
					additionalProperties: {
						type: 'number',
					},
				},
				isPaused: {
					type: 'boolean',
					optional: false, nullable: false,
				},
				metrics: {
					type: 'object',
					optional: false, nullable: false,
					properties: {
						completed: {
							optional: false, nullable: false,
							ref: 'QueueMetrics',
						},
						failed: {
							optional: false, nullable: false,
							ref: 'QueueMetrics',
						},
					},
				},
			},
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
	},
	required: [],
} as const;

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
