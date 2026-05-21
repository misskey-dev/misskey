/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import type { AntennasRepository } from '@/models/_.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { QueryService } from '@/core/QueryService.js';
import { AntennaEntityService } from '@/core/entities/AntennaEntityService.js';
import { DI } from '@/di-symbols.js';

export const meta = {
	tags: ['users', 'antennas'],

	description: 'Show all public antennas this user owns.',

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'object',
			optional: false, nullable: false,
			ref: 'Antenna',
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
		sinceDate: { type: 'integer' },
		untilDate: { type: 'integer' },
	},
	required: ['userId'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.antennasRepository)
		private antennasRepository: AntennasRepository,

		private antennaEntityService: AntennaEntityService,
		private queryService: QueryService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const query = this.queryService.makePaginationQuery(this.antennasRepository.createQueryBuilder('antenna'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
				.andWhere('antenna.userId = :userId', { userId: ps.userId })
				.andWhere('antenna.isPublic = true');

			const antennas = await query
				.limit(ps.limit)
				.getMany();

			return await this.antennaEntityService.packMany(antennas, me);
		});
	}
}
