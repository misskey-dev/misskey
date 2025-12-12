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
				type: { type: 'string' },
				wallPosition: { type: 'string' },
				positionIndex: { type: 'number' },
				baseItem: {
					type: 'object',
					nullable: true,
					properties: {
						id: { type: 'string' },
						name: { type: 'string' },
						imageUrl: { type: 'string', nullable: true },
					},
				},
				attachedItem: {
					type: 'object',
					nullable: true,
					properties: {
						id: { type: 'string' },
						name: { type: 'string' },
						imageUrl: { type: 'string', nullable: true },
						isPlayerCreated: { type: 'boolean' },
					},
				},
			},
		},
	},

	errors: {
		playerNotFound: {
			message: 'Player not found.',
			code: 'PLAYER_NOT_FOUND',
			id: 'a1b2c3d4-wall-0003-0001-000000000001',
		},
		houseNotFound: {
			message: 'House not found.',
			code: 'HOUSE_NOT_FOUND',
			id: 'a1b2c3d4-wall-0003-0001-000000000002',
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

		@Inject(DI.noctownHouseWallItemsRepository)
		private noctownHouseWallItemsRepository: NoctownHouseWallItemsRepository,

		@Inject(DI.noctownPlayerItemsRepository)
		private noctownPlayerItemsRepository: NoctownPlayerItemsRepository,

		@Inject(DI.noctownItemsRepository)
		private noctownItemsRepository: NoctownItemsRepository,
	) {
		super(meta, paramDef, async (ps, me) => {
			const player = await this.noctownPlayersRepository.findOneBy({ userId: me.id });
			if (!player) {
				throw new ApiError(meta.errors.playerNotFound);
			}

			// Find the house (allow viewing any house's wall items)
			const house = await this.noctownHousesRepository.findOneBy({ id: ps.houseId });
			if (!house) {
				throw new ApiError(meta.errors.houseNotFound);
			}

			// Get all wall items for this house
			const wallItems = await this.noctownHouseWallItemsRepository.find({
				where: { houseId: ps.houseId },
				order: { wallPosition: 'ASC', positionIndex: 'ASC' },
			});

			// Build response with item details
			const result = [];
			for (const wallItem of wallItems) {
				let baseItem = null;
				let attachedItem = null;

				// Get base item details
				if (wallItem.baseItemId) {
					const item = await this.noctownItemsRepository.findOneBy({ id: wallItem.baseItemId });
					if (item) {
						baseItem = {
							id: item.id,
							name: item.name,
							imageUrl: item.imageUrl,
						};
					}
				}

				// Get attached item details (for frames)
				if (wallItem.attachedPlayerItemId) {
					const playerItem = await this.noctownPlayerItemsRepository.findOne({
						where: { id: wallItem.attachedPlayerItemId },
						relations: ['item'],
					});
					if (playerItem && playerItem.item) {
						attachedItem = {
							id: playerItem.id,
							name: playerItem.item.name,
							imageUrl: playerItem.item.imageUrl,
							// Player-created items show full image, others show item icon
							isPlayerCreated: playerItem.item.creatorId != null,
						};
					}
				}

				result.push({
					id: wallItem.id,
					type: wallItem.type,
					wallPosition: wallItem.wallPosition,
					positionIndex: wallItem.positionIndex,
					baseItem,
					attachedItem,
				});
			}

			return result;
		});
	}
}
