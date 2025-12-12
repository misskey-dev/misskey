/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable, Inject } from '@nestjs/common';
import { In, LessThan, Between } from 'typeorm';
import { DI } from '@/di-symbols.js';
import type { NoctownDroppedItemsRepository, NoctownItemsRepository, NoctownWorldsRepository } from '@/models/_.js';
import { IdService } from '@/core/IdService.js';
import { generateItem, generateItemSeed, type ItemCategory, type ItemRarity } from './item-generator.js';
import { getChunkGenerator, CHUNK_SIZE, type BiomeType } from './chunk-generator.js';

export interface DropConfig {
	maxDroppedItemsPerChunk: number;
	itemDespawnTimeMs: number;
	spawnCheckIntervalMs: number;
	baseSpawnChance: number;
}

const DEFAULT_CONFIG: DropConfig = {
	maxDroppedItemsPerChunk: 10,
	itemDespawnTimeMs: 30 * 60 * 1000, // 30 minutes
	spawnCheckIntervalMs: 60 * 1000, // 1 minute
	baseSpawnChance: 0.3,
};

// Biome-specific item spawn rates
const BIOME_ITEM_MODIFIERS: Record<BiomeType, { categories: ItemCategory[]; rarityBoost: number }> = {
	plains: { categories: ['material', 'seed', 'consumable'], rarityBoost: 0 },
	forest: { categories: ['material', 'seed', 'tool', 'consumable'], rarityBoost: 0.1 },
	desert: { categories: ['material', 'special', 'tool'], rarityBoost: 0.15 },
	mountain: { categories: ['material', 'equipment', 'special'], rarityBoost: 0.2 },
	ocean: { categories: ['material', 'decoration', 'special'], rarityBoost: 0.1 },
	swamp: { categories: ['material', 'consumable', 'seed'], rarityBoost: 0.05 },
	tundra: { categories: ['material', 'equipment', 'special'], rarityBoost: 0.25 },
};

// Rarity to numeric value mapping
const RARITY_VALUES: Record<ItemRarity, number> = {
	common: 0,
	uncommon: 1,
	rare: 2,
	epic: 3,
	legendary: 4,
};

@Injectable()
export class ItemDropService {
	private config: DropConfig;
	private worldSeed: number | null = null;

	constructor(
		@Inject(DI.noctownDroppedItemsRepository)
		private droppedItemsRepository: NoctownDroppedItemsRepository,

		@Inject(DI.noctownItemsRepository)
		private itemsRepository: NoctownItemsRepository,

		@Inject(DI.noctownWorldsRepository)
		private worldsRepository: NoctownWorldsRepository,

		private idService: IdService,
	) {
		this.config = { ...DEFAULT_CONFIG };
	}

	/**
	 * Initialize the service and get world seed
	 */
	public async initialize(): Promise<void> {
		const world = await this.worldsRepository.findOne({
			where: {},
			order: { createdAt: 'ASC' },
		});

		if (world) {
			this.worldSeed = parseInt(world.seed, 10);
		} else {
			this.worldSeed = Math.floor(Math.random() * 2147483647);
		}
	}

	/**
	 * Spawn items in a chunk based on biome and randomness
	 */
	public async spawnItemsInChunk(chunkX: number, chunkZ: number): Promise<number> {
		if (this.worldSeed === null) {
			await this.initialize();
		}

		// Check current item count in chunk
		const existingCount = await this.getDroppedItemCountInChunk(chunkX, chunkZ);
		if (existingCount >= this.config.maxDroppedItemsPerChunk) {
			return 0;
		}

		// Get chunk generator for biome info
		const generator = getChunkGenerator(this.worldSeed!);
		const biome = generator.getBiomeAt(chunkX * CHUNK_SIZE, chunkZ * CHUNK_SIZE);
		const biomeConfig = BIOME_ITEM_MODIFIERS[biome];

		// Calculate how many items to spawn
		const spawnSlots = this.config.maxDroppedItemsPerChunk - existingCount;
		let spawnedCount = 0;

		for (let i = 0; i < spawnSlots; i++) {
			// Random chance to spawn
			if (Math.random() > this.config.baseSpawnChance) continue;

			// Generate position within chunk
			const localX = Math.random() * CHUNK_SIZE;
			const localZ = Math.random() * CHUNK_SIZE;
			const worldX = chunkX * CHUNK_SIZE + localX;
			const worldZ = chunkZ * CHUNK_SIZE + localZ;
			const height = generator.getHeightAt(worldX, worldZ);

			// Skip water tiles
			if (height <= 3) continue;

			// Generate item
			const itemSeed = generateItemSeed(this.worldSeed!, worldX, worldZ, Date.now() + i);
			const generatedItem = generateItem(itemSeed);

			// Check if category matches biome
			if (!biomeConfig.categories.includes(generatedItem.category)) {
				// 50% chance to skip non-matching category
				if (Math.random() > 0.5) continue;
			}

			// Apply rarity boost
			const rarityValue = RARITY_VALUES[generatedItem.rarity];
			const boostedRarity = Math.min(4, rarityValue + (Math.random() < biomeConfig.rarityBoost ? 1 : 0));

			// Create or find item in database
			const item = await this.findOrCreateItem(generatedItem, boostedRarity);

			// Create dropped item
			await this.droppedItemsRepository.insert({
				id: this.idService.gen(),
				itemId: item.id,
				positionX: worldX,
				positionY: height * 0.2 + 0.5, // Slightly above ground
				positionZ: worldZ,
				droppedAt: new Date(),
			});

			spawnedCount++;
		}

		return spawnedCount;
	}

	/**
	 * Find or create an item in the database
	 */
	private async findOrCreateItem(
		generatedItem: ReturnType<typeof generateItem>,
		rarityValue: number,
	): Promise<{ id: string }> {
		// Check if similar item already exists
		const existingItem = await this.itemsRepository.findOne({
			where: {
				name: generatedItem.name,
				rarity: rarityValue,
			},
		});

		if (existingItem) {
			return existingItem;
		}

		// Create new item
		const itemId = this.idService.gen();
		await this.itemsRepository.insert({
			id: itemId,
			name: generatedItem.name,
			flavorText: generatedItem.flavorText,
			rarity: rarityValue,
			itemType: this.categoryToItemType(generatedItem.category),
			isUnique: false,
			isPlayerCreated: false,
			creatorId: null,
			imageUrl: null,
			fullImageUrl: null,
			shopPrice: this.calculateShopPrice(rarityValue),
			shopSellPrice: this.calculateSellPrice(rarityValue),
		});

		return { id: itemId };
	}

	/**
	 * Convert category to item type
	 */
	private categoryToItemType(category: ItemCategory): 'normal' | 'tool' | 'seed' | 'placeable' {
		switch (category) {
			case 'equipment':
			case 'tool':
				return 'tool';
			case 'seed':
				return 'seed';
			case 'decoration':
				return 'placeable';
			default:
				return 'normal';
		}
	}

	/**
	 * Calculate shop price based on rarity
	 */
	private calculateShopPrice(rarity: number): number | null {
		const basePrices = [100, 500, 2000, 10000, 50000];
		return basePrices[rarity] ?? null;
	}

	/**
	 * Calculate sell price based on rarity
	 */
	private calculateSellPrice(rarity: number): number | null {
		const baseSellPrices = [10, 50, 200, 1000, 5000];
		return baseSellPrices[rarity] ?? null;
	}

	/**
	 * Get dropped items in a radius around a position
	 */
	public async getDroppedItemsInRadius(
		x: number,
		z: number,
		radius: number,
	): Promise<Array<{
		id: string;
		itemId: string;
		itemName: string;
		itemType: string;
		positionX: number;
		positionY: number;
		positionZ: number;
	}>> {
		// Query with bounding box first (for index usage), then filter by actual distance
		const items = await this.droppedItemsRepository.find({
			where: {
				positionX: Between(x - radius, x + radius),
				positionZ: Between(z - radius, z + radius),
			},
			relations: ['item'],
			take: 100,
		});

		// Filter by actual distance and map to response format
		return items
			.filter(item => {
				const dx = item.positionX - x;
				const dz = item.positionZ - z;
				return dx * dx + dz * dz <= radius * radius;
			})
			.map(item => ({
				id: item.id,
				itemId: item.itemId,
				itemName: item.item?.name ?? 'Unknown',
				itemType: item.item?.itemType ?? 'normal',
				positionX: item.positionX,
				positionY: item.positionY,
				positionZ: item.positionZ,
			}));
	}

	/**
	 * Get count of dropped items in a chunk
	 */
	public async getDroppedItemCountInChunk(chunkX: number, chunkZ: number): Promise<number> {
		const minX = chunkX * CHUNK_SIZE;
		const maxX = (chunkX + 1) * CHUNK_SIZE;
		const minZ = chunkZ * CHUNK_SIZE;
		const maxZ = (chunkZ + 1) * CHUNK_SIZE;

		return await this.droppedItemsRepository.count({
			where: {
				positionX: Between(minX, maxX),
				positionZ: Between(minZ, maxZ),
			},
		});
	}

	/**
	 * Pick up a dropped item
	 */
	public async pickupItem(droppedItemId: string): Promise<{ itemId: string } | null> {
		const droppedItem = await this.droppedItemsRepository.findOneBy({ id: droppedItemId });
		if (!droppedItem) {
			return null;
		}

		const itemId = droppedItem.itemId;

		// Delete dropped item
		await this.droppedItemsRepository.delete({ id: droppedItemId });

		return { itemId };
	}

	/**
	 * Clean up old dropped items (despawn)
	 */
	public async cleanupOldItems(): Promise<number> {
		const cutoffTime = new Date(Date.now() - this.config.itemDespawnTimeMs);

		const result = await this.droppedItemsRepository.delete({
			droppedAt: LessThan(cutoffTime),
		});

		return result.affected ?? 0;
	}

	/**
	 * Drop an item at a position (for player drops, NPC drops, etc.)
	 */
	public async dropItem(
		itemId: string,
		x: number,
		y: number,
		z: number,
	): Promise<string> {
		const id = this.idService.gen();

		await this.droppedItemsRepository.insert({
			id,
			itemId,
			positionX: x,
			positionY: y,
			positionZ: z,
			droppedAt: new Date(),
		});

		return id;
	}

	/**
	 * Spawn items in multiple chunks around a position
	 */
	public async spawnItemsAroundPosition(
		x: number,
		z: number,
		chunkRadius: number = 2,
	): Promise<number> {
		const centerChunkX = Math.floor(x / CHUNK_SIZE);
		const centerChunkZ = Math.floor(z / CHUNK_SIZE);

		let totalSpawned = 0;

		for (let dx = -chunkRadius; dx <= chunkRadius; dx++) {
			for (let dz = -chunkRadius; dz <= chunkRadius; dz++) {
				const spawned = await this.spawnItemsInChunk(
					centerChunkX + dx,
					centerChunkZ + dz,
				);
				totalSpawned += spawned;
			}
		}

		return totalSpawned;
	}
}
