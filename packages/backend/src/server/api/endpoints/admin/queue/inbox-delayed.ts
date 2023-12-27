/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { URL } from 'node:url';
import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { InboxQueue } from '@/core/QueueModule.js';
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
			items: {
				anyOf: [
					{
						type: 'string',
					},
					{
						type: 'number',
					},
				],
			},
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
		@Inject('queue:inbox') public inboxQueue: InboxQueue,

		private apiLoggerService: ApiLoggerService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const jobs = await this.inboxQueue.getJobs(['delayed']);

			const res = [] as [string, number][];

			for (const job of jobs) {
				let host: string;
				try {
					host = new URL(job.data.signature.keyId).host;
				} catch (e) {
					this.apiLoggerService.logger.warn(`failed to parse url in ${job.id}: ${e}`);
					this.apiLoggerService.logger.warn(`id: ${job.id}, data: ${JSON.stringify(job.data)}`);
					continue;
				}

				const found = res.find(x => x[0] === host);
				if (found) {
					found[1]++;
				} else {
					res.push([host, 1]);
				}
			}

			res.sort((a, b) => b[1] - a[1]);

			return res;
		});
	}
}
