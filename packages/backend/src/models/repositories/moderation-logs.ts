import { db } from '@/db/postgre.js';
import { Users } from '../index.js';
import { ModerationLog } from '@/models/entities/moderation-log.js';
import { awaitAll } from '@/prelude/await-all.js';

export const ModerationLogRepository = db.getRepository(ModerationLog).extend({
	async pack(
		src: ModerationLog['id'] | ModerationLog,
	) {
		const log = typeof src === 'object' ? src : await this.findOneByOrFail({ id: src });

		return await awaitAll({
			id: log.id,
			createdAt: log.createdAt.toISOString(),
			type: log.type,
			info: log.info,
			userId: log.userId,
			user: Users.pack(log.user || log.userId, null, {
				detail: true,
			}),
		});
	},

	packMany(
		reports: any[],
	) {
		return Promise.all(reports.map(x => this.pack(x)));
	},
});
