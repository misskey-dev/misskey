/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import * as v from 'valibot';
import * as mi from '@/misc/schema/index.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { QueryService } from '@/core/QueryService.js';
import { FlashEntityService } from '@/core/entities/FlashEntityService.js';
import type { FlashsRepository } from '@/models/_.js';
import { DI } from '@/di-symbols.js';
import { packedFlashSchema } from '@/models/schema/flash.js';

export const meta = {
	tags: ['users', 'flashs'],

	description: 'Show all flashs this user created.',

	res: v.array(packedFlashSchema),
} as const;

export const paramDef = v.object({
	userId: mi.misskeyId(),
	...mi.paginationEntries({ max: 100, default: 10 }),
	...mi.paginationDateEntries(),
});
 
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject(DI.flashsRepository)
		private flashsRepository: FlashsRepository,

		private flashEntityService: FlashEntityService,
		private queryService: QueryService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const query = this.queryService.makePaginationQuery(this.flashsRepository.createQueryBuilder('flash'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
				.andWhere('flash.userId = :userId', { userId: ps.userId })
				.andWhere('flash.visibility = \'public\'');

			const flashs = await query
				.limit(ps.limit)
				.getMany();

			return await this.flashEntityService.packMany(flashs);
		});
	}
}
