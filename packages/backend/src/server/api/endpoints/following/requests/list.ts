import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { QueryService } from '@/core/QueryService.js';
import type { FollowRequestsRepository } from '@/models/index.js';
import { FollowRequestEntityService } from '@/core/entities/FollowRequestEntityService.js';
import { DI } from '@/di-symbols.js';

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<'following/requests/list'> {
	name = 'following/requests/list' as const;
	constructor(
		@Inject(DI.followRequestsRepository)
		private followRequestsRepository: FollowRequestsRepository,

		private followRequestEntityService: FollowRequestEntityService,
		private queryService: QueryService,
	) {
		super(async (ps, me) => {
			const query = this.queryService.makePaginationQuery(this.followRequestsRepository.createQueryBuilder('request'), ps.sinceId, ps.untilId)
				.andWhere('request.followeeId = :meId', { meId: me.id });

			const requests = await query
				.take(ps.limit)
				.getMany();

			return await Promise.all(requests.map(req => this.followRequestEntityService.pack(req)));
		});
	}
}
