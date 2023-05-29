import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { ModerationLogsRepository } from '@/models/index.js';
import { QueryService } from '@/core/QueryService.js';
import { DI } from '@/di-symbols.js';
import { ModerationLogEntityService } from '@/core/entities/ModerationLogEntityService.js';

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<'admin/show-moderation-logs'> {
	name = 'admin/show-moderation-logs' as const;
	constructor(
		@Inject(DI.moderationLogsRepository)
		private moderationLogsRepository: ModerationLogsRepository,

		private moderationLogEntityService: ModerationLogEntityService,
		private queryService: QueryService,
	) {
		super(async (ps, me) => {
			const query = this.queryService.makePaginationQuery(this.moderationLogsRepository.createQueryBuilder('report'), ps.sinceId, ps.untilId);

			const reports = await query.take(ps.limit).getMany();

			return await this.moderationLogEntityService.packMany(reports);
		});
	}
}
