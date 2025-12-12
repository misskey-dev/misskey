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
	NoctownHouseWallItemsRepository,
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
			id: 'a1b2c3d4-wall-0002-0001-000000000001',
		},
		houseNotFound: {
			message: 'House not found or not owned by player.',
			code: 'HOUSE_NOT_FOUND',
			id: 'a1b2c3d4-wall-0002-0001-000000000002',
		},
		wallItemNotFound: {
			message: 'Wall item (frame) not found.',
			code: 'WALL_ITEM_NOT_FOUND',
			id: 'a1b2c3d4-wall-0002-0001-000000000003',
		},
		notAFrame: {
			message: 'Wall item is not a frame.',
			code: 'NOT_A_FRAME',
			id: 'a1b2c3d4-wall-0002-0001-000000000004',
		},
		itemNotFound: {
			message: 'Item not found in inventory.',
			code: 'ITEM_NOT_FOUND',
			id: 'a1b2c3d4-wall-0002-0001-000000000005',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		houseId: { type: 'string' },
		wallItemId: { type: 'string' },
		playerItemId: { type: 'string' },
	},
	required: ['houseId', 'wallItemId', 'playerItemId'],
} as const;

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

			// Get the wall item (frame)
			const wallItem = await this.noctownHouseWallItemsRepository.findOneBy({
				id: ps.wallItemId,
				houseId: ps.houseId,
			});
			if (!wallItem) {
				throw new ApiError(meta.errors.wallItemNotFound);
			}

			// Check if it's a frame
			if (wallItem.type !== 'frame') {
				throw new ApiError(meta.errors.notAFrame);
			}

			// Get the player's item to attach
			const playerItem = await this.noctownPlayerItemsRepository.findOne({
				where: { id: ps.playerItemId, playerId: player.id },
				relations: ['item'],
			});
			if (!playerItem || !playerItem.item) {
				throw new ApiError(meta.errors.itemNotFound);
			}

			// Return previously attached item to inventory if any
			if (wallItem.attachedPlayerItemId) {
				// The attached item stays in inventory but we update the reference
			}

			// Update frame with attached item
			// Note: For frames, we don't consume the item - we just reference it
			// The item stays in player's inventory but is "displayed" in the frame
			await this.noctownHouseWallItemsRepository.update(wallItem.id, {
				attachedPlayerItemId: ps.playerItemId,
				updatedAt: new Date(),
			});

			return { success: true };
		});
	}
}
