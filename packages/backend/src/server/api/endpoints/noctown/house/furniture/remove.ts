/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import { IdService } from '@/core/IdService.js';
import type {
	NoctownPlayersRepository,
	NoctownHousesRepository,
	NoctownHouseFurnituresRepository,
	NoctownPlayerItemsRepository,
} from '@/models/_.js';
import { ApiError } from '@/server/api/error.js';

export const meta = {
	tags: ['noctown'],

	requireCredential: true,
	kind: 'write:account',

	res: {
		type: 'object',
		optional: false, nullable: false,
		properties: {
			success: { type: 'boolean' },
		},
	},

	errors: {
		playerNotFound: {
			message: 'Player not found.',
			code: 'PLAYER_NOT_FOUND',
			id: 'a1b2c3d4-furn-0004-0001-000000000001',
		},
		houseNotFound: {
			message: 'House not found or not owned by player.',
			code: 'HOUSE_NOT_FOUND',
			id: 'a1b2c3d4-furn-0004-0001-000000000002',
		},
		furnitureNotFound: {
			message: 'Furniture not found.',
			code: 'FURNITURE_NOT_FOUND',
			id: 'a1b2c3d4-furn-0004-0001-000000000003',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		houseId: { type: 'string' },
		furnitureId: { type: 'string' },
	},
	required: ['houseId', 'furnitureId'],
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

		@Inject(DI.noctownPlayerItemsRepository)
		private noctownPlayerItemsRepository: NoctownPlayerItemsRepository,

		private idService: IdService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const player = await this.noctownPlayersRepository.findOneBy({ userId: me.id });
			if (!player) {
				throw new ApiError(meta.errors.playerNotFound);
			}

			// Verify house ownership
			const house = await this.noctownHousesRepository.findOneBy({
				id: ps.houseId,
				ownerId: player.id,
			});
			if (!house) {
				throw new ApiError(meta.errors.houseNotFound);
			}

			// Get the furniture
			const furniture = await this.noctownHouseFurnituresRepository.findOneBy({
				id: ps.furnitureId,
				houseId: ps.houseId,
			});
			if (!furniture) {
				throw new ApiError(meta.errors.furnitureNotFound);
			}

			// Return item to inventory
			const existingItem = await this.noctownPlayerItemsRepository.findOneBy({
				playerId: player.id,
				itemId: furniture.itemId,
			});

			if (existingItem) {
				await this.noctownPlayerItemsRepository.update(existingItem.id, {
					quantity: existingItem.quantity + 1,
				});
			} else {
				await this.noctownPlayerItemsRepository.insert({
					id: this.idService.gen(),
					playerId: player.id,
					itemId: furniture.itemId,
					quantity: 1,
					acquiredAt: new Date(),
				});
			}

			// Delete furniture
			await this.noctownHouseFurnituresRepository.delete(furniture.id);

			return { success: true };
		});
	}
}
