/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';

export const meta = {
	requireCredential: true,
	requireAdmin: true,
	kind: 'read:admin:index-stats',

	tags: ['admin'],
	res: {
		type: 'array',
		items: {
			type: 'object',
			properties: {
				tablename: { type: 'string' },
				indexname: { type: 'string' },
			},
		},
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
		@Inject(DI.db)
		private db: DataSource,
	) {
		super(meta, paramDef, async () => {
			const stats = await this.db.query('SELECT * FROM pg_indexes;').then(recs => {
				const res = [] as { tablename: string; indexname: string; }[];
				for (const rec of recs) {
					res.push(rec);
				}
				return res;
			});

			return stats;
		});
	}
}
