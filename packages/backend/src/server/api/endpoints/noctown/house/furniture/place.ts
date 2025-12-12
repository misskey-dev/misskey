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
			furnitureId: { type: 'string', nullable: true },
		},
	},

	errors: {
		playerNotFound: {
			message: 'Player not found.',
			code: 'PLAYER_NOT_FOUND',
			id: 'a1b2c3d4-furn-0001-0001-000000000001',
		},
		houseNotFound: {
			message: 'House not found or not owned by player.',
			code: 'HOUSE_NOT_FOUND',
			id: 'a1b2c3d4-furn-0001-0001-000000000002',
		},
		itemNotFound: {
			message: 'Item not found in inventory.',
			code: 'ITEM_NOT_FOUND',
			id: 'a1b2c3d4-furn-0001-0001-000000000003',
		},
		invalidItemType: {
			message: 'Item is not furniture.',
			code: 'INVALID_ITEM_TYPE',
			id: 'a1b2c3d4-furn-0001-0001-000000000004',
		},
		maxFurnitureReached: {
			message: 'Maximum furniture limit reached.',
			code: 'MAX_FURNITURE_REACHED',
			id: 'a1b2c3d4-furn-0001-0001-000000000005',
		},
		invalidPosition: {
			message: 'Invalid position (outside interior bounds).',
			code: 'INVALID_POSITION',
			id: 'a1b2c3d4-furn-0001-0001-000000000006',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		houseId: { type: 'string' },
		playerItemId: { type: 'string' },
		x: { type: 'number' },
		z: { type: 'number' },
		rotation: { type: 'number', default: 0 },
	},
	required: ['houseId', 'playerItemId', 'x', 'z'],
} as const;

const MAX_FURNITURE_PER_HOUSE = 20;
const INTERIOR_MAX_X = 8;
const INTERIOR_MAX_Z = 8;

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

			// Check furniture limit
			const furnitureCount = await this.noctownHouseFurnituresRepository.countBy({
				houseId: ps.houseId,
			});
			if (furnitureCount >= MAX_FURNITURE_PER_HOUSE) {
				throw new ApiError(meta.errors.maxFurnitureReached);
			}

			// Validate position (within interior bounds)
			if (ps.x < 1 || ps.x >= INTERIOR_MAX_X - 1 || ps.z < 1 || ps.z >= INTERIOR_MAX_Z - 1) {
				throw new ApiError(meta.errors.invalidPosition);
			}

			// Get the player's item
			const playerItem = await this.noctownPlayerItemsRepository.findOne({
				where: { id: ps.playerItemId, playerId: player.id },
				relations: ['item'],
			});
			if (!playerItem || !playerItem.item) {
				throw new ApiError(meta.errors.itemNotFound);
			}

			// Check if item is furniture type
			if (playerItem.item.itemType !== 'furniture') {
				throw new ApiError(meta.errors.invalidItemType);
			}

			// Consume from inventory
			if (playerItem.quantity > 1) {
				await this.noctownPlayerItemsRepository.update(ps.playerItemId, {
					quantity: playerItem.quantity - 1,
				});
			} else {
				await this.noctownPlayerItemsRepository.delete(ps.playerItemId);
			}

			// Create furniture placement
			const furnitureId = this.idService.gen();
			await this.noctownHouseFurnituresRepository.insert({
				id: furnitureId,
				houseId: ps.houseId,
				itemId: playerItem.itemId,
				positionX: ps.x,
				positionZ: ps.z,
				rotation: ps.rotation ?? 0,
				placedAt: new Date(),
			});

			return {
				success: true,
				furnitureId,
			};
		});
	}
}
