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
	NoctownHouseWallItemsRepository,
	NoctownPlayerItemsRepository,
	NoctownItemsRepository,
} from '@/models/_.js';
import { ApiError } from '@/server/api/error.js';
import type { WallItemType } from '@/models/noctown/NoctownHouseWallItem.js';

export const meta = {
	tags: ['noctown'],

	requireCredential: true,
	kind: 'write:account',

	res: {
		type: 'object',
		optional: false, nullable: false,
		properties: {
			success: { type: 'boolean' },
			wallItemId: { type: 'string', nullable: true },
		},
	},

	errors: {
		playerNotFound: {
			message: 'Player not found.',
			code: 'PLAYER_NOT_FOUND',
			id: 'a1b2c3d4-wall-0001-0001-000000000001',
		},
		houseNotFound: {
			message: 'House not found or not owned by player.',
			code: 'HOUSE_NOT_FOUND',
			id: 'a1b2c3d4-wall-0001-0001-000000000002',
		},
		itemNotFound: {
			message: 'Item not found in inventory.',
			code: 'ITEM_NOT_FOUND',
			id: 'a1b2c3d4-wall-0001-0001-000000000003',
		},
		invalidItemType: {
			message: 'Item is not a wallpaper or frame.',
			code: 'INVALID_ITEM_TYPE',
			id: 'a1b2c3d4-wall-0001-0001-000000000004',
		},
		invalidWallPosition: {
			message: 'Invalid wall position.',
			code: 'INVALID_WALL_POSITION',
			id: 'a1b2c3d4-wall-0001-0001-000000000005',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		houseId: { type: 'string' },
		wallPosition: { type: 'string', enum: ['north', 'east', 'south', 'west'] },
		positionIndex: { type: 'number', default: 0 },
		playerItemId: { type: 'string' },
	},
	required: ['houseId', 'wallPosition', 'playerItemId'],
} as const;

const VALID_WALL_POSITIONS = ['north', 'east', 'south', 'west'];

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.noctownPlayersRepository)
		private noctownPlayersRepository: NoctownPlayersRepository,

		@Inject(DI.noctownHousesRepository)
		private noctownHousesRepository: NoctownHousesRepository,

		@Inject(DI.noctownHouseWallItemsRepository)
		private noctownHouseWallItemsRepository: NoctownHouseWallItemsRepository,

		@Inject(DI.noctownPlayerItemsRepository)
		private noctownPlayerItemsRepository: NoctownPlayerItemsRepository,

		@Inject(DI.noctownItemsRepository)
		private noctownItemsRepository: NoctownItemsRepository,

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

			// Validate wall position
			if (!VALID_WALL_POSITIONS.includes(ps.wallPosition)) {
				throw new ApiError(meta.errors.invalidWallPosition);
			}

			// Get the player's item
			const playerItem = await this.noctownPlayerItemsRepository.findOne({
				where: { id: ps.playerItemId, playerId: player.id },
				relations: ['item'],
			});
			if (!playerItem || !playerItem.item) {
				throw new ApiError(meta.errors.itemNotFound);
			}

			// Determine wall item type from item
			let wallItemType: WallItemType;
			if (playerItem.item.itemType === 'wallpaper') {
				wallItemType = 'wallpaper';
			} else if (playerItem.item.itemType === 'frame') {
				wallItemType = 'frame';
			} else {
				throw new ApiError(meta.errors.invalidItemType);
			}

			// Check if there's already a wall item at this position
			const existingWallItem = await this.noctownHouseWallItemsRepository.findOneBy({
				houseId: ps.houseId,
				wallPosition: ps.wallPosition,
				positionIndex: ps.positionIndex ?? 0,
				type: wallItemType,
			});

			if (existingWallItem) {
				// Update existing
				await this.noctownHouseWallItemsRepository.update(existingWallItem.id, {
					baseItemId: playerItem.itemId,
					updatedAt: new Date(),
				});

				// Consume from inventory (if not already using this item)
				if (existingWallItem.baseItemId !== playerItem.itemId) {
					if (playerItem.quantity > 1) {
						await this.noctownPlayerItemsRepository.update(ps.playerItemId, {
							quantity: playerItem.quantity - 1,
						});
					} else {
						await this.noctownPlayerItemsRepository.delete(ps.playerItemId);
					}
				}

				return {
					success: true,
					wallItemId: existingWallItem.id,
				};
			} else {
				// Create new wall item
				const wallItemId = this.idService.gen();
				await this.noctownHouseWallItemsRepository.insert({
					id: wallItemId,
					houseId: ps.houseId,
					type: wallItemType,
					wallPosition: ps.wallPosition,
					positionIndex: ps.positionIndex ?? 0,
					baseItemId: playerItem.itemId,
					attachedPlayerItemId: null,
					createdAt: new Date(),
				});

				// Consume from inventory
				if (playerItem.quantity > 1) {
					await this.noctownPlayerItemsRepository.update(ps.playerItemId, {
						quantity: playerItem.quantity - 1,
					});
				} else {
					await this.noctownPlayerItemsRepository.delete(ps.playerItemId);
				}

				return {
					success: true,
					wallItemId,
				};
			}
		});
	}
}
