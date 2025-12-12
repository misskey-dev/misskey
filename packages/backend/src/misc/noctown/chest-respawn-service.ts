/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { LessThan, IsNull, Or } from 'typeorm';
import { DI } from '@/di-symbols.js';
import type { NoctownTreasureChestsRepository, NoctownItemsRepository } from '@/models/_.js';
import { bindThis } from '@/decorators.js';

/**
 * Service for managing treasure chest respawns.
 * Chests respawn after a certain amount of time based on their rarity.
 * When respawned, they get new random contents.
 */
@Injectable()
export class ChestRespawnService {
	constructor(
		@Inject(DI.noctownTreasureChestsRepository)
		private noctownTreasureChestsRepository: NoctownTreasureChestsRepository,

		@Inject(DI.noctownItemsRepository)
		private noctownItemsRepository: NoctownItemsRepository,
	) {}

	/**
	 * Process all chests that are due for respawn.
	 * This should be called periodically (e.g., by a cron job).
	 */
	@bindThis
	public async processRespawns(): Promise<number> {
		const now = new Date();

		// Find all chests that are opened and have passed their respawn time
		const chestsToRespawn = await this.noctownTreasureChestsRepository.find({
			where: {
				isOpened: true,
				respawnAt: LessThan(now),
			},
			take: 100, // Process in batches to avoid overloading
		});

		let respawnedCount = 0;

		for (const chest of chestsToRespawn) {
			await this.respawnChest(chest.id, chest.rarity);
			respawnedCount++;
		}

		return respawnedCount;
	}

	/**
	 * Respawn a specific chest with new contents.
	 */
	@bindThis
	public async respawnChest(chestId: string, rarity: string): Promise<void> {
		// Generate new contents for the chest
		const newContents = await this.generateChestContents(rarity);

		await this.noctownTreasureChestsRepository.update(
			{ id: chestId },
			{
				isOpened: false,
				openedByPlayerId: null,
				openedAt: null,
				respawnAt: null,
				containedItemId: newContents.itemId,
				containedQuantity: newContents.quantity,
				bonusCoins: newContents.bonusCoins,
			},
		);
	}

	/**
	 * Generate random contents for a chest based on its rarity.
	 */
	@bindThis
	private async generateChestContents(rarity: string): Promise<{
		itemId: string | null;
		quantity: number;
		bonusCoins: number;
	}> {
		// Chance to have an item (higher for better chests)
		const itemChance: Record<string, number> = {
			common: 0.5,
			uncommon: 0.6,
			rare: 0.7,
			epic: 0.8,
			legendary: 0.9,
		};

		// Bonus coin ranges by rarity
		const bonusCoinRange: Record<string, [number, number]> = {
			common: [0, 5],
			uncommon: [0, 15],
			rare: [5, 30],
			epic: [10, 50],
			legendary: [25, 100],
		};

		let itemId: string | null = null;
		let quantity = 1;

		const shouldHaveItem = Math.random() < (itemChance[rarity] || 0.5);

			if (shouldHaveItem) {
			// Select appropriate item rarities based on chest rarity
			// rarity is 0-5 (N, R, SR, SSR, UR, LR)
			const possibleItemRarities = this.getItemRaritiesForChest(rarity);
			const selectedRarity = possibleItemRarities[Math.floor(Math.random() * possibleItemRarities.length)];

			const items = await this.noctownItemsRepository.find({
				where: { rarity: selectedRarity },
				take: 20,
			});

			if (items.length > 0) {
				const selectedItem = items[Math.floor(Math.random() * items.length)];
				itemId = selectedItem.id;

				// Determine quantity based on item rarity
				// rarity is number: 0=N, 1=R, 2=SR, 3=SSR, 4=UR, 5=LR
				const quantityRange: Record<number, [number, number]> = {
					0: [1, 5], // N (common)
					1: [1, 3], // R (uncommon)
					2: [1, 2], // SR (rare)
					3: [1, 2], // SSR (epic)
					4: [1, 1], // UR (legendary)
					5: [1, 1], // LR
				};
				const [min, max] = quantityRange[selectedItem.rarity] || [1, 1];
				quantity = Math.floor(Math.random() * (max - min + 1)) + min;
			}
		}

		// Calculate bonus coins
		const [minCoins, maxCoins] = bonusCoinRange[rarity] || [0, 5];
		const bonusCoins = Math.floor(Math.random() * (maxCoins - minCoins + 1)) + minCoins;

		return { itemId, quantity, bonusCoins };
	}

	/**
	 * Get possible item rarities for a chest based on chest rarity.
	 * Returns number array: 0=N, 1=R, 2=SR, 3=SSR, 4=UR, 5=LR
	 */
	private getItemRaritiesForChest(chestRarity: string): number[] {
		switch (chestRarity) {
			case 'legendary':
				return [2, 3, 4]; // SR, SSR, UR
			case 'epic':
				return [1, 2, 3]; // R, SR, SSR
			case 'rare':
				return [0, 1, 2]; // N, R, SR
			case 'uncommon':
				return [0, 1]; // N, R
			case 'common':
			default:
				return [0]; // N
		}
	}

	/**
	 * Get all chests in a chunk that are available (not opened or have respawned).
	 */
	@bindThis
	public async getAvailableChestsInChunk(chunkX: number, chunkZ: number): Promise<Array<{
		id: string;
		localX: number;
		localZ: number;
		positionY: number;
		rarity: string;
		interiorId: string | null;
	}>> {
		const now = new Date();

		const chests = await this.noctownTreasureChestsRepository.find({
			where: [
				{
					chunkX,
					chunkZ,
					isOpened: false,
				},
				{
					chunkX,
					chunkZ,
					isOpened: true,
					respawnAt: LessThan(now),
				},
			],
		});

		return chests.map(chest => ({
			id: chest.id,
			localX: chest.localX,
			localZ: chest.localZ,
			positionY: chest.positionY,
			rarity: chest.rarity,
			interiorId: chest.interiorId,
		}));
	}

	/**
	 * Get all chests in an interior that are available.
	 */
	@bindThis
	public async getAvailableChestsInInterior(interiorId: string): Promise<Array<{
		id: string;
		localX: number;
		localZ: number;
		positionY: number;
		rarity: string;
	}>> {
		const now = new Date();

		const chests = await this.noctownTreasureChestsRepository.find({
			where: [
				{
					interiorId,
					isOpened: false,
				},
				{
					interiorId,
					isOpened: true,
					respawnAt: LessThan(now),
				},
			],
		});

		return chests.map(chest => ({
			id: chest.id,
			localX: chest.localX,
			localZ: chest.localZ,
			positionY: chest.positionY,
			rarity: chest.rarity,
		}));
	}
}
