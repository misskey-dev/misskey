/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import type {
	NoctownPlayersRepository,
	NoctownHousesRepository,
	NoctownHouseFurnituresRepository,
	NoctownItemsRepository,
} from '@/models/_.js';
import { ApiError } from '@/server/api/error.js';

export const meta = {
	tags: ['noctown'],

	requireCredential: true,
	kind: 'read:account',

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'object',
			properties: {
				id: { type: 'string' },
				positionX: { type: 'number' },
				positionZ: { type: 'number' },
				rotation: { type: 'number' },
				item: {
					type: 'object',
					nullable: true,
					properties: {
						id: { type: 'string' },
						name: { type: 'string' },
						imageUrl: { type: 'string', nullable: true },
					},
				},
			},
		},
	},

	errors: {
		playerNotFound: {
			message: 'Player not found.',
			code: 'PLAYER_NOT_FOUND',
			id: 'a1b2c3d4-furn-0002-0001-000000000001',
		},
		houseNotFound: {
			message: 'House not found.',
			code: 'HOUSE_NOT_FOUND',
			id: 'a1b2c3d4-furn-0002-0001-000000000002',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		houseId: { type: 'string' },
	},
	required: ['houseId'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.noctownPlayersRepository)
		private noctownPlayersRepository: NoctownPlayersRepository,

		@Inject(DI.noctownHousesRepository)
		private noctownHousesRepository: NoctownHousesRepository,

		@Inject(DI.noctownHouseFurnituresRepository)
		private noctownHouseFurnituresRepository: NoctownHouseFurnituresRepository,

		@Inject(DI.noctownItemsRepository)
		private noctownItemsRepository: NoctownItemsRepository,
	) {
		super(meta, paramDef, async (ps, me) => {
			const player = await this.noctownPlayersRepository.findOneBy({ userId: me.id });
			if (!player) {
				throw new ApiError(meta.errors.playerNotFound);
			}

			// Find the house (allow viewing any house's furniture)
			const house = await this.noctownHousesRepository.findOneBy({ id: ps.houseId });
			if (!house) {
				throw new ApiError(meta.errors.houseNotFound);
			}

			// Get all furniture for this house
			const furniture = await this.noctownHouseFurnituresRepository.find({
				where: { houseId: ps.houseId },
			});

			// Build response with item details
			const result = [];
			for (const furn of furniture) {
				const item = await this.noctownItemsRepository.findOneBy({ id: furn.itemId });

				result.push({
					id: furn.id,
					positionX: furn.positionX,
					positionZ: furn.positionZ,
					rotation: furn.rotation,
					item: item ? {
						id: item.id,
						name: item.name,
						imageUrl: item.imageUrl,
					} : null,
				});
			}

			return result;
		});
	}
}
