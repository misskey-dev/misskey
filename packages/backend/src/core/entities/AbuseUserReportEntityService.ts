import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type { AbuseUserReportsRepository } from '@/models/index.js';
import { awaitAll } from '@/misc/prelude/await-all.js';
import type { AbuseUserReport } from '@/models/entities/AbuseUserReport.js';
import { UserEntityService } from './UserEntityService.js';

@Injectable()
export class AbuseUserReportEntityService {
	constructor(
		@Inject(DI.abuseUserReportsRepository)
		private abuseUserReportsRepository: AbuseUserReportsRepository,

		private userEntityService: UserEntityService,
	) {
	}

	public async pack(
		src: AbuseUserReport['id'] | AbuseUserReport,
	) {
		const report = typeof src === 'object' ? src : await this.abuseUserReportsRepository.findOneByOrFail({ id: src });

		return await awaitAll({
			id: report.id,
			createdAt: report.createdAt.toISOString(),
			comment: report.comment,
			resolved: report.resolved,
			reporterId: report.reporterId,
			targetUserId: report.targetUserId,
			assigneeId: report.assigneeId,
			reporter: this.userEntityService.pack(report.reporter ?? report.reporterId, null, {
				detail: true,
			}),
			targetUser: this.userEntityService.pack(report.targetUser ?? report.targetUserId, null, {
				detail: true,
			}),
			assignee: report.assigneeId ? this.userEntityService.pack(report.assignee ?? report.assigneeId, null, {
				detail: true,
			}) : null,
			forwarded: report.forwarded,
		});
	}

	public packMany(
		reports: any[],
	) {
		return Promise.all(reports.map(x => this.pack(x)));
	}
}
