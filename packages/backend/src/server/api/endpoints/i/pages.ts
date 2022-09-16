import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { Pages } from '@/models/index.js';
import { QueryService } from '@/services/QueryService.js';
import { PageEntityService } from '@/services/entities/PageEntityService.js';
import { DI } from '@/di-symbols.js';

export const meta = {
	tags: ['account', 'pages'],

	requireCredential: true,

	kind: 'read:pages',

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'object',
			optional: false, nullable: false,
			ref: 'Page',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
		sinceId: { type: 'string', format: 'misskey:id' },
		untilId: { type: 'string', format: 'misskey:id' },
	},
	required: [],
} as const;

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject(DI.pagesRepository)
		private pagesRepository: typeof Pages,

		private pageEntityService: PageEntityService,
		private queryService: QueryService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const query = this.queryService.makePaginationQuery(this.pagesRepository.createQueryBuilder('page'), ps.sinceId, ps.untilId)
				.andWhere('page.userId = :meId', { meId: me.id });

			const pages = await query
				.take(ps.limit)
				.getMany();

			return await this.pageEntityService.packMany(pages);
		});
	}
}
