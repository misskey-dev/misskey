/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import * as v from 'valibot';
import * as mi from '@/misc/schema/index.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { RenoteMutingsRepository } from '@/models/_.js';
import { QueryService } from '@/core/QueryService.js';
import { RenoteMutingEntityService } from '@/core/entities/RenoteMutingEntityService.js';
import { DI } from '@/di-symbols.js';
import { packedRenoteMutingSchema } from '@/models/schema/renote-muting.js';

export const meta = {
	tags: ['account'],

	requireCredential: true,

	kind: 'read:mutes',

	res: v.array(packedRenoteMutingSchema),
} as const;

export const paramDef = v.object({
	...mi.paginationEntries({ max: 100, default: 30 }),
	...mi.paginationDateEntries(),
});

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.renoteMutingsRepository)
		private renoteMutingsRepository: RenoteMutingsRepository,

		private renoteMutingEntityService: RenoteMutingEntityService,
		private queryService: QueryService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const query = this.queryService.makePaginationQuery(this.renoteMutingsRepository.createQueryBuilder('muting'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
				.andWhere('muting.muterId = :meId', { meId: me.id });

			const mutings = await query
				.limit(ps.limit)
				.getMany();

			return await this.renoteMutingEntityService.packMany(mutings, me);
		});
	}
}
