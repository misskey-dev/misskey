/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import * as v from 'valibot';
import * as mi from '@/misc/schema/index.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { PagesRepository } from '@/models/_.js';
import { QueryService } from '@/core/QueryService.js';
import { PageEntityService } from '@/core/entities/PageEntityService.js';
import { DI } from '@/di-symbols.js';
import { packedPageSchema } from '@/models/schema/page.js';

export const meta = {
	tags: ['account', 'pages'],

	requireCredential: true,

	kind: 'read:pages',

	res: v.array(packedPageSchema),
} as const;

export const paramDef = v.object({
	...mi.paginationEntries({ max: 100, default: 10 }),
	...mi.paginationDateEntries(),
});

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.pagesRepository)
		private pagesRepository: PagesRepository,

		private pageEntityService: PageEntityService,
		private queryService: QueryService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const query = this.queryService.makePaginationQuery(this.pagesRepository.createQueryBuilder('page'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
				.andWhere('page.userId = :meId', { meId: me.id });

			const pages = await query
				.limit(ps.limit)
				.getMany();

			return await this.pageEntityService.packMany(pages);
		});
	}
}
