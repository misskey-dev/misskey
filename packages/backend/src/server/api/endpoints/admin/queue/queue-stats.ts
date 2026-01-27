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
		type: 'object',
		optional: false, nullable: false,
		properties: {
			name: {
				type: 'string',
				optional: false, nullable: false,
				enum: QUEUE_TYPES,
			},
			qualifiedName: {
				type: 'string',
				optional: false, nullable: false,
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
			db: {
				type: 'object',
				optional: false, nullable: false,
				properties: {
					version: {
						type: 'string',
						optional: false, nullable: false,
					},
					mode: {
						type: 'string',
						optional: false, nullable: false,
						enum: ['cluster', 'standalone', 'sentinel'],
					},
					runId: {
						type: 'string',
						optional: false, nullable: false,
					},
					processId: {
						type: 'string',
						optional: false, nullable: false,
					},
					port: {
						type: 'number',
						optional: false, nullable: false,
					},
					os: {
						type: 'string',
						optional: false, nullable: false,
					},
					uptime: {
						type: 'number',
						optional: false, nullable: false,
					},
					memory: {
						type: 'object',
						optional: false, nullable: false,
						properties: {
							total: {
								type: 'number',
								optional: false, nullable: false,
							},
							used: {
								type: 'number',
								optional: false, nullable: false,
							},
							fragmentationRatio: {
								type: 'number',
								optional: false, nullable: false,
							},
							peak: {
								type: 'number',
								optional: false, nullable: false,
							},
						},
					},
					clients: {
						type: 'object',
						optional: false, nullable: false,
						properties: {
							blocked: {
								type: 'number',
								optional: false, nullable: false,
							},
							connected: {
								type: 'number',
								optional: false, nullable: false,
							},
						},
					},
				},
			}
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		queue: { type: 'string', enum: QUEUE_TYPES },
	},
	required: ['queue'],
} as const;

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
