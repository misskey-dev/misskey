import { Inject, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';

export const meta = {
	requireCredential: true,
	requireModerator: true,

	tags: ['admin'],

	res: {
		type: 'object',
		optional: false, nullable: false,
		example: {
			migrations: {
				count: 66,
				size: 32768,
			},
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {},
	required: [],
} as const;

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
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
