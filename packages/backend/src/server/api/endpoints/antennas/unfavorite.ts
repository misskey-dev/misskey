/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import type { AntennasRepository, AntennaFavoritesRepository } from '@/models/_.js';
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
			id: 'e1f2a3b4-c5d6-4e7f-8a9b-0c1d2e3f4a5b',
		},

		notFavorited: {
			message: 'You have not favorited the antenna.',
			code: 'NOT_FAVORITED',
			id: 'b6a7c8d9-e0f1-4a2b-9c3d-4e5f6a7b8c9d',
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
	) {
		super(meta, paramDef, async (ps, me) => {
			const antenna = await this.antennasRepository.findOneBy({ id: ps.antennaId });
			if (antenna == null) {
				throw new ApiError(meta.errors.noSuchAntenna);
			}

			const exist = await this.antennaFavoritesRepository.findOneBy({
				antennaId: antenna.id,
				userId: me.id,
			});

			if (exist == null) {
				throw new ApiError(meta.errors.notFavorited);
			}

			await this.antennaFavoritesRepository.delete(exist.id);
		});
	}
}
