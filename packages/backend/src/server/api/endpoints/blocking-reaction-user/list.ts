/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { BlockingReactionUsersRepository } from '@/models/_.js';
import { QueryService } from '@/core/QueryService.js';
import { DI } from '@/di-symbols.js';
import { BlockingReactionUserEntityService } from '@/core/entities/BlockingReactionUserEntityService.js';

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
		@Inject(DI.blockingReactionUsersRepository)
		private blockingReactionUsersRepository: BlockingReactionUsersRepository,

		private blockingReactionUserEntityService: BlockingReactionUserEntityService,
		private queryService: QueryService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const query = this.queryService.makePaginationQuery(this.blockingReactionUsersRepository.createQueryBuilder('blocking_reaction_user'), ps.sinceId, ps.untilId)
				.andWhere('blocking_reaction_user.blockerId = :meId', { meId: me.id });

			const blockings = await query
				.limit(ps.limit)
				.getMany();

			return await this.blockingReactionUserEntityService.packMany(blockings, me);
		});
	}
}
