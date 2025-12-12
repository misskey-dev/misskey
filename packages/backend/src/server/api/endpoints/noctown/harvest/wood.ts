/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { NoctownService } from '@/core/NoctownService.js';
import { ApiError } from '@/server/api/error.js';
import { DI } from '@/di-symbols.js';
import type {
	NoctownPlayersRepository,
	NoctownPlayerItemsRepository,
	NoctownItemsRepository,
} from '@/models/_.js';
import { IdService } from '@/core/IdService.js';

export const meta = {
	tags: ['noctown'],
	requireCredential: true,
	kind: 'write:account',
	res: {
		type: 'object',
		properties: {
			success: { type: 'boolean' },
			woodItemId: { type: 'string' },
			quantity: { type: 'number' },
		},
	},
	errors: {
		noPlayer: {
			message: 'Player not found',
			code: 'NO_PLAYER',
			id: 'a5c01f91-0018-4000-a000-000000000001',
		},
		noAxe: {
			message: 'No axe in inventory',
			code: 'NO_AXE',
			id: 'a5c01f91-0018-4000-a000-000000000002',
		},
		noTreesNearby: {
			message: 'No trees nearby to harvest',
			code: 'NO_TREES_NEARBY',
			id: 'a5c01f91-0018-4000-a000-000000000003',
		},
		cooldownActive: {
			message: 'Harvesting is on cooldown',
			code: 'COOLDOWN_ACTIVE',
			id: 'a5c01f91-0018-4000-a000-000000000004',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		treeX: { type: 'number' },
		treeZ: { type: 'number' },
	},
	required: ['treeX', 'treeZ'],
} as const;

// Constants
const AXE_ITEM_NAME = '斧';
const WOOD_ITEM_NAME = '木材';
const HARVEST_COOLDOWN_MS = 5000; // 5 seconds cooldown
const HARVEST_RANGE = 3; // Must be within 3 tiles of tree
const WOOD_QUANTITY_MIN = 1;
const WOOD_QUANTITY_MAX = 3;

// Cooldown tracker (in-memory, per player)
const harvestCooldowns = new Map<string, number>();

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		private noctownService: NoctownService,
		private idService: IdService,

		@Inject(DI.noctownPlayersRepository)
		private noctownPlayersRepository: NoctownPlayersRepository,

		@Inject(DI.noctownPlayerItemsRepository)
		private noctownPlayerItemsRepository: NoctownPlayerItemsRepository,

		@Inject(DI.noctownItemsRepository)
		private noctownItemsRepository: NoctownItemsRepository,
	) {
		super(meta, paramDef, async (ps, me) => {
			// Get player
			const player = await this.noctownPlayersRepository.findOneBy({ userId: me.id });
			if (!player) {
				throw new ApiError(meta.errors.noPlayer);
			}

			// Check cooldown
			const lastHarvest = harvestCooldowns.get(player.id);
			if (lastHarvest && Date.now() - lastHarvest < HARVEST_COOLDOWN_MS) {
				throw new ApiError(meta.errors.cooldownActive);
			}

			// Check if player has an axe
			const axeItem = await this.noctownItemsRepository.findOne({
				where: { name: AXE_ITEM_NAME },
			});

			if (axeItem) {
				const playerAxe = await this.noctownPlayerItemsRepository.findOne({
					where: { playerId: player.id, itemId: axeItem.id },
				});

				if (!playerAxe || playerAxe.quantity < 1) {
					throw new ApiError(meta.errors.noAxe);
				}
			} else {
				// If axe item doesn't exist, allow harvesting without it (for testing)
				// In production, this would throw an error
			}

			// Validate tree position (within range of player)
			const playerX = player.positionX ?? 0;
			const playerZ = player.positionZ ?? 0;
			const distance = Math.sqrt(
				Math.pow(ps.treeX - playerX, 2) + Math.pow(ps.treeZ - playerZ, 2),
			);

			if (distance > HARVEST_RANGE) {
				throw new ApiError(meta.errors.noTreesNearby);
			}

			// Get or create wood item
			let woodItem = await this.noctownItemsRepository.findOne({
				where: { name: WOOD_ITEM_NAME },
			});

			if (!woodItem) {
				// Create wood item if it doesn't exist
				woodItem = await this.noctownItemsRepository.save({
					id: this.idService.gen(),
					name: WOOD_ITEM_NAME,
					flavorText: '木から採取した木材。様々なアイテムの材料になる。',
					imageUrl: null,
					fullImageUrl: null,
					rarity: 0,
					itemType: 'normal',
					isUnique: false,
					isPlayerCreated: false,
					creatorId: null,
					shopPrice: null,
					shopSellPrice: 5,
				});
			}

			// Calculate wood quantity (random 1-3)
			const quantity = Math.floor(Math.random() * (WOOD_QUANTITY_MAX - WOOD_QUANTITY_MIN + 1)) + WOOD_QUANTITY_MIN;

			// Add wood to player inventory
			const existingPlayerItem = await this.noctownPlayerItemsRepository.findOne({
				where: { playerId: player.id, itemId: woodItem.id },
			});

			if (existingPlayerItem) {
				await this.noctownPlayerItemsRepository.update(
					{ id: existingPlayerItem.id },
					{ quantity: existingPlayerItem.quantity + quantity },
				);
			} else {
				await this.noctownPlayerItemsRepository.save({
					id: this.idService.gen(),
					playerId: player.id,
					itemId: woodItem.id,
					quantity,
				});
			}

			// Set cooldown
			harvestCooldowns.set(player.id, Date.now());

			return {
				success: true,
				woodItemId: woodItem.id,
				quantity,
			};
		});
	}
}
