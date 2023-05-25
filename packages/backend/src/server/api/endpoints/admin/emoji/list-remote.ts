import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { EmojisRepository } from '@/models/index.js';
import { QueryService } from '@/core/QueryService.js';
import { UtilityService } from '@/core/UtilityService.js';
import { EmojiEntityService } from '@/core/entities/EmojiEntityService.js';
import { DI } from '@/di-symbols.js';
import { sqlLikeEscape } from '@/misc/sql-like-escape.js';

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<'admin/emoji/list-remote'> {
	name = 'admin/emoji/list-remote' as const;
	constructor(
		@Inject(DI.emojisRepository)
		private emojisRepository: EmojisRepository,

		private utilityService: UtilityService,
		private queryService: QueryService,
		private emojiEntityService: EmojiEntityService,
	) {
		super(async (ps, me) => {
			const q = this.queryService.makePaginationQuery(this.emojisRepository.createQueryBuilder('emoji'), ps.sinceId, ps.untilId);

			if (ps.host == null) {
				q.andWhere('emoji.host IS NOT NULL');
			} else {
				q.andWhere('emoji.host = :host', { host: this.utilityService.toPuny(ps.host) });
			}

			if (ps.query) {
				q.andWhere('emoji.name like :query', { query: '%' + sqlLikeEscape(ps.query) + '%' });
			}

			const emojis = await q
				.orderBy('emoji.id', 'DESC')
				.take(ps.limit)
				.getMany();

			return this.emojiEntityService.packDetailedMany(emojis);
		});
	}
}
