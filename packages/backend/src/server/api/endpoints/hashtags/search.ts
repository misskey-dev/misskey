import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { HashtagsRepository } from '@/models/index.js';
import { DI } from '@/di-symbols.js';
import { sqlLikeEscape } from '@/misc/sql-like-escape.js';

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<'hashtags/search'> {
	name = 'hashtags/search' as const;
	constructor(
		@Inject(DI.hashtagsRepository)
		private hashtagsRepository: HashtagsRepository,
	) {
		super(async (ps, me) => {
			const hashtags = await this.hashtagsRepository.createQueryBuilder('tag')
				.where('tag.name like :q', { q: sqlLikeEscape(ps.query.toLowerCase()) + '%' })
				.orderBy('tag.count', 'DESC')
				.groupBy('tag.id')
				.take(ps.limit)
				.skip(ps.offset)
				.getMany();

			return hashtags.map(tag => tag.name);
		});
	}
}
