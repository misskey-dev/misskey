import define from '../../define.js';
import { db } from '@/db/postgre.js';

export const meta = {
	requireCredential: true,
	requireModerator: true,

	tags: ['admin'],
} as const;

export const paramDef = {
	type: 'object',
	properties: {},
	required: [],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async () => {
	const stats = await db.query(`SELECT * FROM pg_indexes;`).then(recs => {
		const res = [] as { tablename: string; indexname: string; }[];
		for (const rec of recs) {
			res.push(rec);
		}
		return res;
	});

	return stats;
});
