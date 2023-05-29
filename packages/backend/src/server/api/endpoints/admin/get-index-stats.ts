import { Inject, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<'admin/get-index-stats'> {
	name = 'admin/get-index-stats' as const;
	constructor(
		@Inject(DI.db)
		private db: DataSource,
	) {
		super(async () => {
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
