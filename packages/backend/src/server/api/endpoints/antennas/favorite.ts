/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import type { AntennasRepository, AntennaFavoritesRepository } from '@/models/_.js';
import { IdService } from '@/core/IdService.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import { ApiError } from '../../error.js';

export const meta = {
	tags: ['antennas'],

	requireCredential: true,

	prohibitMoved: true,

	kind: 'write:antenna-favorite',

	errors: {
		noSuchAntenna: {
			message: 'No such antenna.',
			code: 'NO_SUCH_ANTENNA',
			id: 'a4d3b7f0-1c1e-4e16-9a8b-3a7e1d2f4b6a',
		},

		alreadyFavorited: {
			message: 'The antenna has already been favorited.',
			code: 'ALREADY_FAVORITED',
			id: 'd2a4e1c6-3b5e-4a8d-9f0c-1e2d3f4a5b6c',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		antennaId: { type: 'string', format: 'misskey:id' },
	},
	required: ['antennaId'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.antennasRepository)
		private antennasRepository: AntennasRepository,

		@Inject(DI.antennaFavoritesRepository)
		private antennaFavoritesRepository: AntennaFavoritesRepository,

		private idService: IdService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const antenna = await this.antennasRepository.findOneBy({ id: ps.antennaId });
			if (antenna == null) {
				throw new ApiError(meta.errors.noSuchAntenna);
			}
			if ((antenna.userId !== me.id) && !antenna.isPublic) {
				throw new ApiError(meta.errors.noSuchAntenna);
			}

			const exist = await this.antennaFavoritesRepository.exists({
				where: {
					antennaId: antenna.id,
					userId: me.id,
				},
			});

			if (exist) {
				throw new ApiError(meta.errors.alreadyFavorited);
			}

			await this.antennaFavoritesRepository.insert({
				id: this.idService.gen(),
				antennaId: antenna.id,
				userId: me.id,
			});
		});
	}
}
