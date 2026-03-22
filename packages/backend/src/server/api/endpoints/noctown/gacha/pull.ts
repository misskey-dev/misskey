/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import type {
	NoctownPlayersRepository,
	NoctownWalletsRepository,
	NoctownGachasRepository,
	NoctownGachaItemsRepository,
	NoctownGachaPullsRepository,
	NoctownPlayerItemsRepository,
	NoctownItemsRepository,
} from '@/models/_.js';
import { IdService } from '@/core/IdService.js';
import { ApiError } from '@/server/api/error.js';

export const meta = {
	tags: ['noctown'],
	requireCredential: true,
	kind: 'write:account',
	errors: {
		noPlayer: {
			message: 'Player not found.',
			code: 'NO_PLAYER',
			id: 'f2b03a02-0001-0001-0001-000000000001',
		},
		noGacha: {
			message: 'Gacha not found.',
			code: 'NO_GACHA',
			id: 'f2b03a02-0001-0001-0002-000000000001',
		},
		gachaNotAvailable: {
			message: 'This gacha is not available.',
			code: 'GACHA_NOT_AVAILABLE',
			id: 'f2b03a02-0001-0001-0003-000000000001',
		},
		insufficientFunds: {
			message: 'Not enough coins.',
			code: 'INSUFFICIENT_FUNDS',
			id: 'f2b03a02-0001-0001-0004-000000000001',
		},
		maxPullsReached: {
			message: 'Maximum pulls reached for this gacha.',
			code: 'MAX_PULLS_REACHED',
			id: 'f2b03a02-0001-0001-0005-000000000001',
		},
		noItemsAvailable: {
			message: 'No items available in this gacha.',
			code: 'NO_ITEMS_AVAILABLE',
			id: 'f2b03a02-0001-0001-0006-000000000001',
		},
	},
	res: {
		type: 'object',
		properties: {
			result: {
				type: 'object',
				properties: {
					itemId: { type: 'string' },
					itemName: { type: 'string' },
					rarityTier: { type: 'number' },
					isUnique: { type: 'boolean' },
					isNew: { type: 'boolean' },
				},
			},
			remainingBalance: { type: 'string' },
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		gachaId: { type: 'string', format: 'misskey:id' },
		count: { type: 'integer', minimum: 1, maximum: 10, default: 1 },
	},
	required: ['gachaId'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject(DI.noctownPlayersRepository)
		private noctownPlayersRepository: NoctownPlayersRepository,
		@Inject(DI.noctownWalletsRepository)
		private noctownWalletsRepository: NoctownWalletsRepository,
		@Inject(DI.noctownGachasRepository)
		private noctownGachasRepository: NoctownGachasRepository,
		@Inject(DI.noctownGachaItemsRepository)
		private noctownGachaItemsRepository: NoctownGachaItemsRepository,
		@Inject(DI.noctownGachaPullsRepository)
		private noctownGachaPullsRepository: NoctownGachaPullsRepository,
		@Inject(DI.noctownPlayerItemsRepository)
		private noctownPlayerItemsRepository: NoctownPlayerItemsRepository,
		@Inject(DI.noctownItemsRepository)
		private noctownItemsRepository: NoctownItemsRepository,
		private idService: IdService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const player = await this.noctownPlayersRepository.findOneBy({ userId: me.id });
			if (!player) {
				throw new ApiError(meta.errors.noPlayer);
			}

			const gacha = await this.noctownGachasRepository.findOneBy({ id: ps.gachaId });
			if (!gacha) {
				throw new ApiError(meta.errors.noGacha);
			}

			// Check availability
			const now = new Date();
			if (!gacha.isActive) {
				throw new ApiError(meta.errors.gachaNotAvailable);
			}
			if (gacha.startDate && gacha.startDate > now) {
				throw new ApiError(meta.errors.gachaNotAvailable);
			}
			if (gacha.endDate && gacha.endDate < now) {
				throw new ApiError(meta.errors.gachaNotAvailable);
			}

			// Check max pulls
			if (gacha.maxPullsPerPlayer) {
				const pullCount = await this.noctownGachaPullsRepository.count({
					where: { gachaId: ps.gachaId, playerId: player.id },
				});
				if (pullCount >= gacha.maxPullsPerPlayer) {
					throw new ApiError(meta.errors.maxPullsReached);
				}
			}

			// Check wallet
			const wallet = await this.noctownWalletsRepository.findOneBy({ playerId: player.id });
			const balance = wallet ? BigInt(wallet.balance) : BigInt(0);
			const totalCost = BigInt(gacha.costPerPull * (ps.count ?? 1));

			if (balance < totalCost) {
				throw new ApiError(meta.errors.insufficientFunds);
			}

			// Get available items
			const gachaItems = await this.noctownGachaItemsRepository.find({
				where: { gachaId: ps.gachaId },
			});

			// Get player's inventory to check for unique items they already own
			const playerInventory = await this.noctownPlayerItemsRepository.find({
				where: { playerId: player.id },
			});
			const ownedItemIds = new Set(playerInventory.map(inv => inv.itemId));

			// Filter out obtained unique items, exhausted items, and unique items player already owns
			const availableItems: typeof gachaItems = [];
			for (const gachaItem of gachaItems) {
				// Skip already obtained unique gacha items (globally)
				if (gachaItem.isUnique && gachaItem.isUniqueObtained) continue;
				// Skip exhausted items
				if (gachaItem.maxQuantity !== null && gachaItem.currentQuantity >= gachaItem.maxQuantity) continue;

				// For unique items, check if player already owns one
				if (gachaItem.isUnique && ownedItemIds.has(gachaItem.itemId)) {
					// Player already owns this unique item, skip
					continue;
				}

				// Also check the actual item's isUnique flag
				const item = await this.noctownItemsRepository.findOneBy({ id: gachaItem.itemId });
				if (item?.isUnique && ownedItemIds.has(gachaItem.itemId)) {
					continue;
				}

				availableItems.push(gachaItem);
			}

			if (availableItems.length === 0) {
				throw new ApiError(meta.errors.noItemsAvailable);
			}

			// Perform pull(s)
			const results: Array<{
				itemId: string;
				itemName: string;
				rarityTier: number;
				isUnique: boolean;
				isNew: boolean;
			}> = [];

			for (let i = 0; i < (ps.count ?? 1); i++) {
				const pulledItem = this.weightedRandom(availableItems);
				const item = await this.noctownItemsRepository.findOneBy({ id: pulledItem.itemId });

				// Check if player already has this item
				const existingItem = await this.noctownPlayerItemsRepository.findOne({
					where: { playerId: player.id, itemId: pulledItem.itemId },
				});
				const isNew = !existingItem;

				// Add item to inventory
				if (existingItem) {
					await this.noctownPlayerItemsRepository.update(
						{ id: existingItem.id },
						{ quantity: existingItem.quantity + 1 },
					);
				} else {
					await this.noctownPlayerItemsRepository.insert({
						id: this.idService.gen(),
						playerId: player.id,
						itemId: pulledItem.itemId,
						quantity: 1,
					});
				}

				// Record pull
				await this.noctownGachaPullsRepository.insert({
					id: this.idService.gen(),
					gachaId: ps.gachaId,
					playerId: player.id,
					itemId: pulledItem.itemId,
					rarityTier: pulledItem.rarityTier,
					wasUnique: pulledItem.isUnique,
				});

				// Update gacha item stats
				if (pulledItem.isUnique) {
					await this.noctownGachaItemsRepository.update(
						{ id: pulledItem.id },
						{ isUniqueObtained: true },
					);
				}
				await this.noctownGachaItemsRepository.increment(
					{ id: pulledItem.id },
					'currentQuantity',
					1,
				);

				results.push({
					itemId: pulledItem.itemId,
					itemName: item?.name ?? 'Unknown',
					rarityTier: pulledItem.rarityTier,
					isUnique: pulledItem.isUnique,
					isNew,
				});
			}

			// Deduct cost
			const newBalance = balance - totalCost;
			if (wallet) {
				await this.noctownWalletsRepository.update(
					{ playerId: player.id },
					{ balance: newBalance.toString() },
				);
			}

			return {
				result: results[0], // For single pull compatibility
				results, // For multi-pull
				remainingBalance: newBalance.toString(),
			};
		});
	}

	private weightedRandom<T extends { weight: number }>(items: T[]): T {
		const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
		let random = Math.random() * totalWeight;

		for (const item of items) {
			random -= item.weight;
			if (random <= 0) {
				return item;
			}
		}

		return items[items.length - 1];
	}
}
