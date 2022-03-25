import { db } from '@/db/postgre.js';
import { Users } from '../index.js';
import { AbuseUserReport } from '@/models/entities/abuse-user-report.js';
import { awaitAll } from '@/prelude/await-all.js';

export const AbuseUserReportRepository = db.getRepository(AbuseUserReport).extend({
	async pack(
		src: AbuseUserReport['id'] | AbuseUserReport,
	) {
		const report = typeof src === 'object' ? src : await this.findOneByOrFail({ id: src });

		return await awaitAll({
			id: report.id,
			createdAt: report.createdAt.toISOString(),
			comment: report.comment,
			resolved: report.resolved,
			reporterId: report.reporterId,
			targetUserId: report.targetUserId,
			assigneeId: report.assigneeId,
			reporter: Users.pack(report.reporter || report.reporterId, null, {
				detail: true,
			}),
			targetUser: Users.pack(report.targetUser || report.targetUserId, null, {
				detail: true,
			}),
			assignee: report.assigneeId ? Users.pack(report.assignee || report.assigneeId, null, {
				detail: true,
			}) : null,
			forwarded: report.forwarded,
		});
	},

	packMany(
		reports: any[],
	) {
		return Promise.all(reports.map(x => this.pack(x)));
	},
});
