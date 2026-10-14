/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import * as v from 'valibot';
import * as mi from '@/misc/schema/index.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { BlockingsRepository } from '@/models/_.js';
import { QueryService } from '@/core/QueryService.js';
import { BlockingEntityService } from '@/core/entities/BlockingEntityService.js';
import { DI } from '@/di-symbols.js';
import { packedBlockingSchema } from '@/models/schema/blocking.js';

export const meta = {
	tags: ['account'],

	requireCredential: true,

	kind: 'read:blocks',

	res: v.array(packedBlockingSchema),
} as const;

export const paramDef = v.object({
	...mi.paginationEntries({ max: 100, default: 30 }),
	...mi.paginationDateEntries(),
});

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.blockingsRepository)
		private blockingsRepository: BlockingsRepository,

		private blockingEntityService: BlockingEntityService,
		private queryService: QueryService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const query = this.queryService.makePaginationQuery(this.blockingsRepository.createQueryBuilder('blocking'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
				.andWhere('blocking.blockerId = :meId', { meId: me.id });

			const blockings = await query
				.limit(ps.limit)
				.getMany();

			return await this.blockingEntityService.packMany(blockings, me);
		});
	}
}
