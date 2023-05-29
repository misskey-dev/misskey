import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { AbuseUserReportsRepository } from '@/models/index.js';
import { QueryService } from '@/core/QueryService.js';
import { DI } from '@/di-symbols.js';
import { AbuseUserReportEntityService } from '@/core/entities/AbuseUserReportEntityService.js';

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<'admin/abuse-user-reports'> {
	name = 'admin/abuse-user-reports' as const;
	constructor(
		@Inject(DI.abuseUserReportsRepository)
		private abuseUserReportsRepository: AbuseUserReportsRepository,

		private abuseUserReportEntityService: AbuseUserReportEntityService,
		private queryService: QueryService,
	) {
		super(async (ps, me) => {
			const query = this.queryService.makePaginationQuery(this.abuseUserReportsRepository.createQueryBuilder('report'), ps.sinceId, ps.untilId);

			switch (ps.state) {
				case 'resolved': query.andWhere('report.resolved = TRUE'); break;
				case 'unresolved': query.andWhere('report.resolved = FALSE'); break;
			}

			switch (ps.reporterOrigin) {
				case 'local': query.andWhere('report.reporterHost IS NULL'); break;
				case 'remote': query.andWhere('report.reporterHost IS NOT NULL'); break;
			}

			switch (ps.targetUserOrigin) {
				case 'local': query.andWhere('report.targetUserHost IS NULL'); break;
				case 'remote': query.andWhere('report.targetUserHost IS NOT NULL'); break;
			}

			const reports = await query.take(ps.limit).getMany();

			return await this.abuseUserReportEntityService.packMany(reports);
		});
	}
}
