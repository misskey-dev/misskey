import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { EmojisRepository } from '@/models/index.js';
import type { Emoji } from '@/models/entities/Emoji.js';
import { QueryService } from '@/core/QueryService.js';
import { DI } from '@/di-symbols.js';
import { EmojiEntityService } from '@/core/entities/EmojiEntityService.js';
//import { sqlLikeEscape } from '@/misc/sql-like-escape.js';

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<'admin/emoji/list'> {
	name = 'admin/emoji/list' as const;
	constructor(
		@Inject(DI.emojisRepository)
		private emojisRepository: EmojisRepository,

		private emojiEntityService: EmojiEntityService,
		private queryService: QueryService,
	) {
		super(async (ps, me) => {
			const q = this.queryService.makePaginationQuery(this.emojisRepository.createQueryBuilder('emoji'), ps.sinceId, ps.untilId)
				.andWhere('emoji.host IS NULL');

			let emojis: Emoji[];

			if (ps.query) {
				//q.andWhere('emoji.name ILIKE :q', { q: `%${ sqlLikeEscape(ps.query) }%` });
				//const emojis = await q.take(ps.limit).getMany();

				emojis = await q.getMany();
				const queryarry = ps.query.match(/\:([a-z0-9_]*)\:/g);

				if (queryarry) {
					emojis = emojis.filter(emoji => 
						queryarry.includes(`:${emoji.name}:`)
					);
				} else {
					emojis = emojis.filter(emoji =>
						emoji.name.includes(ps.query!) ||
						emoji.aliases.some(a => a.includes(ps.query!)) ||
						emoji.category?.includes(ps.query!));
				}
				emojis.splice(ps.limit + 1);
			} else {
				emojis = await q.take(ps.limit).getMany();
			}

			return this.emojiEntityService.packDetailedMany(emojis);
		});
	}
}
