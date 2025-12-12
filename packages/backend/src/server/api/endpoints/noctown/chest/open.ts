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
	NoctownTreasureChestsRepository,
	NoctownWalletsRepository,
	NoctownPlayerItemsRepository,
	NoctownItemsRepository,
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
			rewards: {
				type: 'object',
				nullable: true,
				properties: {
					item: {
						type: 'object',
						nullable: true,
						properties: {
							id: { type: 'string' },
							name: { type: 'string' },
							quantity: { type: 'integer' },
						},
					},
					coins: { type: 'integer' },
				},
			},
		},
	},

	errors: {
		playerNotFound: {
			message: 'Player not found.',
			code: 'PLAYER_NOT_FOUND',
			id: 'c1d2e3f4-0011-0001-0001-000000000001',
		},
		chestNotFound: {
			message: 'Chest not found.',
			code: 'CHEST_NOT_FOUND',
			id: 'c1d2e3f4-0011-0001-0001-000000000002',
		},
		chestAlreadyOpened: {
			message: 'Chest has already been opened.',
			code: 'CHEST_ALREADY_OPENED',
			id: 'c1d2e3f4-0011-0001-0001-000000000003',
		},
		tooFarFromChest: {
			message: 'Too far from the chest.',
			code: 'TOO_FAR_FROM_CHEST',
			id: 'c1d2e3f4-0011-0001-0001-000000000004',
		},
		walletNotFound: {
			message: 'Wallet not found.',
			code: 'WALLET_NOT_FOUND',
			id: 'c1d2e3f4-0011-0001-0001-000000000005',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		chestId: { type: 'string' },
	},
	required: ['chestId'],
} as const;

// Respawn time constants by rarity (in days)
const RESPAWN_DAYS: Record<string, number> = {
	common: 3,
	uncommon: 4,
	rare: 5,
	epic: 7,
	legendary: 14,
};

// Base coin rewards by rarity
const BASE_COINS: Record<string, number> = {
	common: 10,
	uncommon: 25,
	rare: 50,
	epic: 100,
	legendary: 250,
};

// Interaction range (world units)
const CHEST_INTERACTION_RANGE = 3.0;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.noctownPlayersRepository)
		private noctownPlayersRepository: NoctownPlayersRepository,

		@Inject(DI.noctownTreasureChestsRepository)
		private noctownTreasureChestsRepository: NoctownTreasureChestsRepository,

		@Inject(DI.noctownWalletsRepository)
		private noctownWalletsRepository: NoctownWalletsRepository,

		@Inject(DI.noctownPlayerItemsRepository)
		private noctownPlayerItemsRepository: NoctownPlayerItemsRepository,

		@Inject(DI.noctownItemsRepository)
		private noctownItemsRepository: NoctownItemsRepository,

		private idService: IdService,
	) {
		super(meta, paramDef, async (ps, me) => {
			// Get player
			const player = await this.noctownPlayersRepository.findOneBy({ userId: me.id });
			if (!player) {
				throw new ApiError(meta.errors.playerNotFound);
			}

			// Get chest
			const chest = await this.noctownTreasureChestsRepository.findOne({
				where: { id: ps.chestId },
				relations: ['containedItem'],
			});
			if (!chest) {
				throw new ApiError(meta.errors.chestNotFound);
			}

			// Check if chest is already opened and hasn't respawned yet
			if (chest.isOpened) {
				if (chest.respawnAt && chest.respawnAt > new Date()) {
					throw new ApiError(meta.errors.chestAlreadyOpened);
				}
				// Chest has respawned, reset it
				chest.isOpened = false;
				chest.openedByPlayerId = null;
				chest.openedAt = null;
			}

			// Calculate chest world position
			const chunkSize = 64; // Match chunk-generator.ts CHUNK_SIZE
			const chestWorldX = chest.chunkX * chunkSize + chest.localX;
			const chestWorldZ = chest.chunkZ * chunkSize + chest.localZ;

			// Check if player is close enough to the chest
			const dx = player.positionX - chestWorldX;
			const dz = player.positionZ - chestWorldZ;
			const distance = Math.sqrt(dx * dx + dz * dz);

			if (distance > CHEST_INTERACTION_RANGE) {
				throw new ApiError(meta.errors.tooFarFromChest);
			}

			// Get wallet
			const wallet = await this.noctownWalletsRepository.findOneBy({ playerId: player.id });
			if (!wallet) {
				throw new ApiError(meta.errors.walletNotFound);
			}

			// Calculate rewards
			const rewards: {
				item: { id: string; name: string; quantity: number } | null;
				coins: number;
			} = {
				item: null,
				coins: 0,
			};

			// Add coins based on rarity (with some randomness)
			const baseCoins = BASE_COINS[chest.rarity] || 10;
			const coinVariance = Math.floor(baseCoins * 0.3); // ±30% variance
			rewards.coins = baseCoins + Math.floor(Math.random() * coinVariance * 2) - coinVariance + chest.bonusCoins;

			// Add contained item if any
			if (chest.containedItem && chest.containedItemId) {
				rewards.item = {
					id: chest.containedItem.id,
					name: chest.containedItem.name,
					quantity: chest.containedQuantity,
				};

				// Add item to player inventory
				const existingItem = await this.noctownPlayerItemsRepository.findOneBy({
					playerId: player.id,
					itemId: chest.containedItemId,
				});

				if (existingItem) {
					await this.noctownPlayerItemsRepository.update(
						{ id: existingItem.id },
						{ quantity: existingItem.quantity + chest.containedQuantity },
					);
				} else {
					await this.noctownPlayerItemsRepository.insert({
						id: this.idService.gen(),
						playerId: player.id,
						itemId: chest.containedItemId,
						quantity: chest.containedQuantity,
					});
				}
			} else {
				// If no pre-determined item, generate random loot based on rarity
				const randomItem = await this.generateRandomLoot(chest.rarity);
				if (randomItem) {
					rewards.item = {
						id: randomItem.id,
						name: randomItem.name,
						quantity: randomItem.quantity,
					};

					const existingItem = await this.noctownPlayerItemsRepository.findOneBy({
						playerId: player.id,
						itemId: randomItem.id,
					});

					if (existingItem) {
						await this.noctownPlayerItemsRepository.update(
							{ id: existingItem.id },
							{ quantity: existingItem.quantity + randomItem.quantity },
						);
					} else {
						await this.noctownPlayerItemsRepository.insert({
							id: this.idService.gen(),
							playerId: player.id,
							itemId: randomItem.id,
							quantity: randomItem.quantity,
						});
					}
				}
			}

			// Add coins to wallet (using balance field)
			const newBalance = BigInt(wallet.balance) + BigInt(rewards.coins);
			await this.noctownWalletsRepository.update(
				{ id: wallet.id },
				{ balance: newBalance.toString() },
			);

			// Calculate respawn time
			const respawnDays = RESPAWN_DAYS[chest.rarity] || 3;
			const respawnAt = new Date();
			respawnAt.setDate(respawnAt.getDate() + respawnDays);

			// Mark chest as opened
			await this.noctownTreasureChestsRepository.update(
				{ id: chest.id },
				{
					isOpened: true,
					openedByPlayerId: player.id,
					openedAt: new Date(),
					respawnAt: respawnAt,
				},
			);

			return {
				success: true,
				rewards,
			};
		});
	}

	private async generateRandomLoot(rarity: string): Promise<{ id: string; name: string; quantity: number } | null> {
		// Get random item based on rarity
		// Higher rarity chests have chance for rarer items
		// rarity is number: 0=N, 1=R, 2=SR, 3=SSR, 4=UR, 5=LR
		const rarityValues: Record<string, number[]> = {
			common: [0],           // N only
			uncommon: [0, 1],       // N, R
			rare: [0, 1, 2],        // N, R, SR
			epic: [1, 2, 3],        // R, SR, SSR
			legendary: [2, 3, 4],   // SR, SSR, UR
		};

		const possibleRarities = rarityValues[rarity] || [0];
		const selectedRarity = possibleRarities[Math.floor(Math.random() * possibleRarities.length)];

		// Try to find items with the selected rarity
		const items = await this.noctownItemsRepository.find({
			where: { rarity: selectedRarity },
			take: 20,
		});

		if (items.length === 0) {
			return null;
		}

		const selectedItem = items[Math.floor(Math.random() * items.length)];

		// Calculate quantity based on item rarity
		// rarity is number: 0=N, 1=R, 2=SR, 3=SSR, 4=UR, 5=LR
		const baseQuantity: Record<number, number> = {
			0: 3, // N
			1: 2, // R
			2: 1, // SR
			3: 1, // SSR
			4: 1, // UR
			5: 1, // LR
		};
		let quantity = baseQuantity[selectedItem.rarity] || 1;
		// Add some variance
		quantity = Math.max(1, quantity + Math.floor(Math.random() * 2) - 1);

		return {
			id: selectedItem.id,
			name: selectedItem.name,
			quantity,
		};
	}
}
