/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { AntennaFavoritesRepository } from '@/models/_.js';
import { DI } from '@/di-symbols.js';
import { AntennaEntityService } from '@/core/entities/AntennaEntityService.js';

export const meta = {
	tags: ['account', 'antennas'],

	requireCredential: true,

	kind: 'read:antenna-favorite',

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
	},
	required: [],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.antennaFavoritesRepository)
		private antennaFavoritesRepository: AntennaFavoritesRepository,

		private antennaEntityService: AntennaEntityService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const favorites = await this.antennaFavoritesRepository.createQueryBuilder('favorite')
				.andWhere('favorite.userId = :meId', { meId: me.id })
				.leftJoinAndSelect('favorite.antenna', 'antenna')
				.getMany();

			return this.antennaEntityService.packMany(favorites.map(x => x.antenna!), me);
		});
	}
}
