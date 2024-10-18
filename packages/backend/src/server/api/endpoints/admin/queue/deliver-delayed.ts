/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { URL } from 'node:url';
import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { DeliverQueue } from '@/core/QueueModule.js';
import { ApiLoggerService } from '@/server/api/ApiLoggerService.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,
	kind: 'read:admin:queue',

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'array',
			optional: false, nullable: false,
			prefixItems: [
				{
					type: 'string',
				},
				{
					type: 'number',
				},
			],
			unevaluatedItems: false,
		},
		example: [[
			'example.com',
			12,
		]],
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {},
	required: [],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject('queue:deliver') public deliverQueue: DeliverQueue,

		private apiLoggerService: ApiLoggerService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const jobs = await this.deliverQueue.getJobs(['delayed']);

			const res = new Map<string, number>();

			for (const job of jobs) {
				let host: string;
				try {
					host = new URL(job.data.to).host;
				} catch (e) {
					this.apiLoggerService.logger.warn(`failed to parse url in ${job.id}: ${e}`);
					this.apiLoggerService.logger.warn(`id: ${job.id}, data: ${JSON.stringify(job.data)}`);
					continue;
				}

				const found = res.get(host);
				if (found) {
					res.set(host, found + 1);
				} else {
					res.set(host, 1);
				}
			}

			return Array.from(res.entries()).sort((a, b) => b[1] - a[1]);
		});
	}
}
