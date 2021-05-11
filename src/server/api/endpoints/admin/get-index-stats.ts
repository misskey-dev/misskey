import define from '../../define';
import { getConnection } from 'typeorm';

export const meta = {
	requireCredential: true as const,
	requireModerator: true,

	tags: ['admin'],

	params: {
	},
};

export default define(meta, async () => {
	const stats = await
		getConnection().query(`SELECT * FROM pg_indexes;`)
		.then(recs => {
			const res = [] as { tablename: string; indexname: string; }[];
			for (const rec of recs) {
				res.push(rec);
			}
			return res;
		});

	return stats;
});
