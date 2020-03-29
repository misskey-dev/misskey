import define from '../../define';
import { getConnection } from 'typeorm';

export const meta = {
	requireCredential: true as const,
	requireModerator: true,

	desc: {
		'en-US': 'Get table stats'
	},

	tags: ['meta'],

	params: {
	},
};

export default define(meta, async () => {
	const sizes = await
		getConnection().query(`
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
