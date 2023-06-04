import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { BlockingsRepository } from '@/models/index.js';
import { QueryService } from '@/core/QueryService.js';
import { BlockingEntityService } from '@/core/entities/BlockingEntityService.js';
import { DI } from '@/di-symbols.js';

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<'blocking/list'> {
	name = 'blocking/list' as const;
	constructor(
		@Inject(DI.blockingsRepository)
		private blockingsRepository: BlockingsRepository,

		private blockingEntityService: BlockingEntityService,
		private queryService: QueryService,
	) {
		super(async (ps, me) => {
			const query = this.queryService.makePaginationQuery(this.blockingsRepository.createQueryBuilder('blocking'), ps.sinceId, ps.untilId)
				.andWhere('blocking.blockerId = :meId', { meId: me.id });

			const blockings = await query
				.take(ps.limit)
				.getMany();

			return await this.blockingEntityService.packMany(blockings, me);
		});
	}
}
