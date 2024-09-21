/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { IEndpointMeta } from '@/server/api/endpoints.js';
import type { Schema } from '@/misc/json-schema.js';
import { DI } from '@/di-symbols.js';

export const meta = {
	requireCredential: true,
	requireAdmin: true,
	kind: 'read:admin:table-stats',

	tags: ['admin'],

	res: {
		type: 'object',
		optional: false, nullable: false,
		additionalProperties: {
			type: 'object',
			properties: {
				count: {
					type: 'number',
				},
				size: {
					type: 'number',
				},
			},
			required: ['count', 'size'],
		},
		example: {
			migrations: {
				count: 66,
				size: 32768,
			},
		},
	},
} as const satisfies IEndpointMeta;

export const paramDef = {
	type: 'object',
	properties: {},
	required: [],
} as const satisfies Schema;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.db)
		private db: DataSource,
	) {
		super(meta, paramDef, async () => {
			const sizes = await this.db.query(`
			SELECT relname AS "table", reltuples as "count", pg_total_relation_size(C.oid) AS "size"
			FROM pg_class C LEFT JOIN pg_namespace N ON (N.oid = C.relnamespace)
			WHERE nspname NOT IN ('pg_catalog', 'information_schema')
				AND C.relkind <> 'i'
				AND nspname !~ '^pg_toast';`)
				.then(recs => {
					const res = {} as Record<string, { count: number; size: number; }>;
					for (const rec of recs) {
						res[rec.table] = {
							count: parseInt(rec.count, 10),
							size: parseInt(rec.size, 10),
						};
					}
					return res;
				});

			return sizes;
		});
	}
}
