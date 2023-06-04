import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { ChannelFollowingsRepository } from '@/models/index.js';
import { QueryService } from '@/core/QueryService.js';
import { ChannelEntityService } from '@/core/entities/ChannelEntityService.js';
import { DI } from '@/di-symbols.js';

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<'channels/followed'> {
	name = 'channels/followed' as const;
	constructor(
		@Inject(DI.channelFollowingsRepository)
		private channelFollowingsRepository: ChannelFollowingsRepository,

		private channelEntityService: ChannelEntityService,
		private queryService: QueryService,
	) {
		super(async (ps, me) => {
			const query = this.queryService.makePaginationQuery(this.channelFollowingsRepository.createQueryBuilder(), ps.sinceId, ps.untilId)
				.andWhere({ followerId: me.id });

			const followings = await query
				.take(ps.limit)
				.getMany();

			return await Promise.all(followings.map(x => this.channelEntityService.pack(x.followeeId, me)));
		});
	}
}
