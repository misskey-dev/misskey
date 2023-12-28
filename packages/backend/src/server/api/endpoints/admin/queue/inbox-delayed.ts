/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { URL } from 'node:url';
import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { InboxQueue } from '@/core/QueueModule.js';

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
	) {
		super(meta, paramDef, async (ps, me) => {
			const jobs = await this.inboxQueue.getJobs(['delayed']);

			const res = [] as [string, number][];

			for (const job of jobs) {
				const host = new URL(job.data.signature.keyId).host;
				if (res.find(x => x[0] === host)) {
					res.find(x => x[0] === host)![1]++;
				} else {
					res.push([host, 1]);
				}
			}

			res.sort((a, b) => b[1] - a[1]);

			return res;
		});
	}
}
