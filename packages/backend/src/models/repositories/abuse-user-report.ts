import { EntityRepository, Repository } from 'typeorm';
import { Users } from '../index';
import { AbuseUserReport } from '@/models/entities/abuse-user-report';
import { awaitAll } from '@/prelude/await-all';

@EntityRepository(AbuseUserReport)
export class AbuseUserReportRepository extends Repository<AbuseUserReport> {
	public async pack(
		src: AbuseUserReport['id'] | AbuseUserReport,
	) {
		const report = typeof src === 'object' ? src : await this.findOneOrFail(src);

		return await awaitAll({
			id: report.id,
			createdAt: report.createdAt,
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
		});
	}

	public packMany(
		reports: any[],
	) {
		return Promise.all(reports.map(x => this.pack(x)));
	}
}
