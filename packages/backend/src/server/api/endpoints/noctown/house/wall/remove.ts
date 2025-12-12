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
			id: 'a1b2c3d4-wall-0004-0001-000000000001',
		},
		houseNotFound: {
			message: 'House not found or not owned by player.',
			code: 'HOUSE_NOT_FOUND',
			id: 'a1b2c3d4-wall-0004-0001-000000000002',
		},
		wallItemNotFound: {
			message: 'Wall item not found.',
			code: 'WALL_ITEM_NOT_FOUND',
			id: 'a1b2c3d4-wall-0004-0001-000000000003',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		houseId: { type: 'string' },
		wallItemId: { type: 'string' },
	},
	required: ['houseId', 'wallItemId'],
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

			// Get the wall item
			const wallItem = await this.noctownHouseWallItemsRepository.findOneBy({
				id: ps.wallItemId,
				houseId: ps.houseId,
			});
			if (!wallItem) {
				throw new ApiError(meta.errors.wallItemNotFound);
			}

			// Delete the wall item
			// Note: The base item is consumed when set, so it's not returned
			// Attached items (in frames) remain in inventory as they're just references
			await this.noctownHouseWallItemsRepository.delete(wallItem.id);

			return { success: true };
		});
	}
}
