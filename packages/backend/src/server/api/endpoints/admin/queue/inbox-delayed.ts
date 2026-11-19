/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
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
		@Inject('queue:inbox') public inboxQueue: InboxQueue,
	) {
		super(meta, paramDef, async (ps, me) => {
			// 遅延ジョブが大量蓄積している場合のメモリ消費を抑えるため、取得件数を制限する
			const jobs = await this.inboxQueue.getJobs(['delayed'], 0, 1000);

			const counts = new Map<string, number>();

			for (const job of jobs) {
				// ジョブデータのURLが不正な形式の場合に集計全体が失敗しないようガードする
				let host: string | null = null;
				try {
					host = new URL(job.data.signature.keyId).host;
				} catch {
					continue;
				}
				counts.set(host, (counts.get(host) ?? 0) + 1);
			}

			const res = [...counts.entries()].sort((a, b) => b[1] - a[1]);

			return res;
		});
	}
}
