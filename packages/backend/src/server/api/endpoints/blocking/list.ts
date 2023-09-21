/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { BlockingsRepository } from '@/models/_.js';
import { QueryService } from '@/core/QueryService.js';
import { BlockingEntityService } from '@/core/entities/BlockingEntityService.js';
import { DI } from '@/di-symbols.js';

export const meta = {
	tags: ['account'],

	requireCredential: true,

	kind: 'read:blocks',

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'object',
			optional: false, nullable: false,
			ref: 'Blocking',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 30 },
		sinceId: { type: 'string', format: 'misskey:id' },
		untilId: { type: 'string', format: 'misskey:id' },
	},
	required: [],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.blockingsRepository)
		private blockingsRepository: BlockingsRepository,

		private blockingEntityService: BlockingEntityService,
		private queryService: QueryService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const query = this.queryService.makePaginationQuery(this.blockingsRepository.createQueryBuilder('blocking'), ps.sinceId, ps.untilId)
				.andWhere('blocking.blockerId = :meId', { meId: me.id });

			const blockings = await query
				.limit(ps.limit)
				.getMany();

			return await this.blockingEntityService.packMany(blockings, me);
		});
	}
}
