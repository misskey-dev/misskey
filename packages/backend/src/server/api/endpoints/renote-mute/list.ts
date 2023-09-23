/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { RenoteMutingsRepository } from '@/models/_.js';
import { QueryService } from '@/core/QueryService.js';
import { RenoteMutingEntityService } from '@/core/entities/RenoteMutingEntityService.js';
import { DI } from '@/di-symbols.js';

export const meta = {
	tags: ['account'],

	requireCredential: true,

	kind: 'read:mutes',

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'object',
			optional: false, nullable: false,
			ref: 'RenoteMuting',
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
		@Inject(DI.renoteMutingsRepository)
		private renoteMutingsRepository: RenoteMutingsRepository,

		private renoteMutingEntityService: RenoteMutingEntityService,
		private queryService: QueryService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const query = this.queryService.makePaginationQuery(this.renoteMutingsRepository.createQueryBuilder('muting'), ps.sinceId, ps.untilId)
				.andWhere('muting.muterId = :meId', { meId: me.id });

			const mutings = await query
				.limit(ps.limit)
				.getMany();

			return await this.renoteMutingEntityService.packMany(mutings, me);
		});
	}
}
