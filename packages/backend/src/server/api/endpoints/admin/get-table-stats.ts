import { db } from '@/db/postgre.js';
import define from '../../define.js';

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
export default define(meta, paramDef, async () => {
	const sizes = await
		db.query(`
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
