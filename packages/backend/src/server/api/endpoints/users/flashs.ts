/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { QueryService } from '@/core/QueryService.js';
import { FlashEntityService } from '@/core/entities/FlashEntityService.js';
import type { FlashsRepository } from '@/models/_.js';
import { DI } from '@/di-symbols.js';

export const meta = {
	tags: ['users', 'flashs'],

	description: 'Show all flashs this user created.',

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'object',
			optional: false, nullable: false,
			ref: 'Flash',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		userId: { type: 'string', format: 'misskey:id' },
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
		sinceId: { type: 'string', format: 'misskey:id' },
		untilId: { type: 'string', format: 'misskey:id' },
	},
	required: ['userId'],
} as const;

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject(DI.flashsRepository)
		private flashsRepository: FlashsRepository,

		private flashEntityService: FlashEntityService,
		private queryService: QueryService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const query = this.queryService.makePaginationQuery(this.flashsRepository.createQueryBuilder('flash'), ps.sinceId, ps.untilId)
				.andWhere('flash.userId = :userId', { userId: ps.userId })
				.andWhere('flash.visibility = \'public\'');

			const flashs = await query
				.limit(ps.limit)
				.getMany();

			return await this.flashEntityService.packMany(flashs);
		});
	}
}
