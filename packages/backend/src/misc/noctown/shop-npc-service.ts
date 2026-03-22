/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import { bindThis } from '@/decorators.js';
import { IdService } from '@/core/IdService.js';
import type {
	NoctownInteriorMapsRepository,
	NoctownShopInventoriesRepository,
	NoctownItemsRepository,
	NoctownPlayerItemsRepository,
	NoctownWalletsRepository,
} from '@/models/_.js';

export interface ShopItem {
	id: string;
	itemId: string;
	name: string;
	flavorText: string | null;
	imageUrl: string | null;
	rarity: number;
	buyPrice: number;
	sellPrice: number | null;
	stock: number | null;
	isAvailable: boolean;
}

export interface ShopNpcData {
	id: string;
	type: string;
	name: string;
	greeting: string;
	inventory: ShopItem[];
}

@Injectable()
export class ShopNpcService {
	constructor(
		@Inject(DI.noctownInteriorMapsRepository)
		private noctownInteriorMapsRepository: NoctownInteriorMapsRepository,

		@Inject(DI.noctownShopInventoriesRepository)
		private noctownShopInventoriesRepository: NoctownShopInventoriesRepository,

		@Inject(DI.noctownItemsRepository)
		private noctownItemsRepository: NoctownItemsRepository,

		@Inject(DI.noctownPlayerItemsRepository)
		private noctownPlayerItemsRepository: NoctownPlayerItemsRepository,

		@Inject(DI.noctownWalletsRepository)
		private noctownWalletsRepository: NoctownWalletsRepository,

		private idService: IdService,
	) {}

	/**
	 * Get shop data for an interior
	 */
	@bindThis
	public async getShopData(interiorId: string): Promise<ShopNpcData | null> {
		// Get interior
		const interior = await this.noctownInteriorMapsRepository.findOneBy({
			interiorId,
		});

		if (!interior || interior.type !== 'shop') {
			return null;
		}

		// Get inventory
		const inventoryItems = await this.noctownShopInventoriesRepository.find({
			where: { interiorMapId: interior.id },
			relations: ['item'],
			order: { displayOrder: 'ASC' },
		});

		const inventory: ShopItem[] = inventoryItems
			.filter(inv => inv.item !== null)
			.map(inv => ({
				id: inv.id,
				itemId: inv.item!.id,
				name: inv.item!.name,
				flavorText: inv.item!.flavorText,
				imageUrl: inv.item!.imageUrl ?? inv.item!.fullImageUrl,
				rarity: inv.item!.rarity,
				buyPrice: inv.buyPrice,
				sellPrice: inv.sellPrice,
				stock: inv.stock,
				isAvailable: inv.isAvailable && (inv.stock === null || inv.stock > 0),
			}));

		// Get NPC name based on interior
		const npcInfo = this.getShopNpcInfo(interior.type);

		return {
			id: `shop_${interiorId}`,
			type: 'shopkeeper',
			name: npcInfo.name,
			greeting: npcInfo.greeting,
			inventory,
		};
	}

	/**
	 * Get NPC info based on shop type
	 */
	private getShopNpcInfo(interiorType: string): { name: string; greeting: string } {
		switch (interiorType) {
			case 'shop':
				return {
					name: '店主',
					greeting: 'いらっしゃいませ！何をお探しですか？',
				};
			case 'inn':
				return {
					name: '宿屋の主人',
					greeting: 'おお、旅人さんかい。何か必要なものはあるかね？',
				};
			case 'guild':
				return {
					name: 'ギルドマスター',
					greeting: '冒険者よ、ギルドショップへようこそ。',
				};
			default:
				return {
					name: '商人',
					greeting: 'いらっしゃい。',
				};
		}
	}

	/**
	 * Buy an item from a shop
	 */
	@bindThis
	public async buyItem(
		playerId: string,
		interiorId: string,
		inventoryItemId: string,
		quantity: number = 1,
	): Promise<{ success: boolean; error?: string; newBalance?: string }> {
		if (quantity < 1) {
			return { success: false, error: 'INVALID_QUANTITY' };
		}

		// Get shop inventory item
		const inventoryItem = await this.noctownShopInventoriesRepository.findOne({
			where: { id: inventoryItemId },
			relations: ['interiorMap', 'item'],
		});

		if (!inventoryItem || !inventoryItem.item) {
			return { success: false, error: 'ITEM_NOT_FOUND' };
		}

		if (!inventoryItem.isAvailable) {
			return { success: false, error: 'ITEM_NOT_AVAILABLE' };
		}

		// Check stock
		if (inventoryItem.stock !== null && inventoryItem.stock < quantity) {
			return { success: false, error: 'INSUFFICIENT_STOCK' };
		}

		// Calculate total price
		const totalPrice = BigInt(inventoryItem.buyPrice) * BigInt(quantity);

		// Get player wallet
		const wallet = await this.noctownWalletsRepository.findOneBy({ playerId });
		if (!wallet) {
			return { success: false, error: 'WALLET_NOT_FOUND' };
		}

		const currentBalance = BigInt(wallet.balance);
		if (currentBalance < totalPrice) {
			return { success: false, error: 'INSUFFICIENT_FUNDS' };
		}

		// Deduct money
		const newBalance = currentBalance - totalPrice;
		await this.noctownWalletsRepository.update(wallet.id, {
			balance: newBalance.toString(),
			updatedAt: new Date(),
		});

		// Add item to player inventory
		const existingItem = await this.noctownPlayerItemsRepository.findOneBy({
			playerId,
			itemId: inventoryItem.itemId,
		});

		if (existingItem) {
			await this.noctownPlayerItemsRepository.update(existingItem.id, {
				quantity: existingItem.quantity + quantity,
			});
		} else {
			await this.noctownPlayerItemsRepository.insert({
				id: this.idService.gen(),
				playerId,
				itemId: inventoryItem.itemId,
				quantity,
				acquiredAt: new Date(),
			});
		}

		// Update stock if limited
		if (inventoryItem.stock !== null) {
			await this.noctownShopInventoriesRepository.update(inventoryItemId, {
				stock: inventoryItem.stock - quantity,
			});
		}

		return { success: true, newBalance: newBalance.toString() };
	}

	/**
	 * Sell an item to a shop
	 */
	@bindThis
	public async sellItem(
		playerId: string,
		interiorId: string,
		playerItemId: string,
		quantity: number = 1,
	): Promise<{ success: boolean; error?: string; newBalance?: string; soldPrice?: number }> {
		if (quantity < 1) {
			return { success: false, error: 'INVALID_QUANTITY' };
		}

		// Get player item
		const playerItem = await this.noctownPlayerItemsRepository.findOne({
			where: { id: playerItemId, playerId },
			relations: ['item'],
		});

		if (!playerItem || !playerItem.item) {
			return { success: false, error: 'ITEM_NOT_FOUND' };
		}

		if (playerItem.quantity < quantity) {
			return { success: false, error: 'INSUFFICIENT_QUANTITY' };
		}

		// Check if item can be sold (has shop sell price)
		const sellPrice = playerItem.item.shopSellPrice;
		if (sellPrice === null) {
			return { success: false, error: 'ITEM_NOT_SELLABLE' };
		}

		// Calculate total
		const totalPrice = BigInt(sellPrice) * BigInt(quantity);

		// Get player wallet
		const wallet = await this.noctownWalletsRepository.findOneBy({ playerId });
		if (!wallet) {
			return { success: false, error: 'WALLET_NOT_FOUND' };
		}

		// Add money
		const currentBalance = BigInt(wallet.balance);
		const newBalance = currentBalance + totalPrice;
		await this.noctownWalletsRepository.update(wallet.id, {
			balance: newBalance.toString(),
			updatedAt: new Date(),
		});

		// Remove item from inventory
		if (playerItem.quantity <= quantity) {
			await this.noctownPlayerItemsRepository.delete(playerItemId);
		} else {
			await this.noctownPlayerItemsRepository.update(playerItemId, {
				quantity: playerItem.quantity - quantity,
			});
		}

		return {
			success: true,
			newBalance: newBalance.toString(),
			soldPrice: sellPrice * quantity,
		};
	}

	/**
	 * Initialize default shop inventory for a new interior
	 */
	@bindThis
	public async initializeShopInventory(interiorMapId: string): Promise<void> {
		// Get some default items to stock
		const items = await this.noctownItemsRepository.find({
			where: { shopPrice: null as unknown as number }, // Get items without shop price first
			take: 10,
		});

		// Also get items that have shop prices defined
		const shopItems = await this.noctownItemsRepository
			.createQueryBuilder('item')
			.where('item."shopPrice" IS NOT NULL')
			.orderBy('item.rarity', 'ASC')
			.take(10)
			.getMany();

		const allItems = [...shopItems, ...items.slice(0, Math.max(0, 10 - shopItems.length))];

		for (let i = 0; i < allItems.length; i++) {
			const item = allItems[i];
			await this.noctownShopInventoriesRepository.insert({
				id: this.idService.gen(),
				interiorMapId,
				itemId: item.id,
				buyPrice: item.shopPrice ?? this.calculateDefaultPrice(item.rarity),
				sellPrice: item.shopSellPrice ?? Math.floor(this.calculateDefaultPrice(item.rarity) * 0.5),
				stock: null, // Unlimited
				isAvailable: true,
				displayOrder: i,
				createdAt: new Date(),
			});
		}
	}

	/**
	 * Calculate default price based on rarity
	 */
	private calculateDefaultPrice(rarity: number): number {
		const basePrices = [10, 50, 200, 1000, 5000, 25000];
		return basePrices[Math.min(rarity, basePrices.length - 1)];
	}

	/**
	 * Restock shop items
	 */
	@bindThis
	public async restockShops(): Promise<number> {
		const now = new Date();
		let restockedCount = 0;

		// Find items that need restocking
		const itemsToRestock = await this.noctownShopInventoriesRepository
			.createQueryBuilder('inv')
			.where('inv."restockIntervalHours" IS NOT NULL')
			.andWhere('inv."maxStock" IS NOT NULL')
			.andWhere('inv.stock < inv."maxStock"')
			.andWhere(
				'(inv."lastRestockAt" IS NULL OR inv."lastRestockAt" < :threshold)',
				{ threshold: new Date(now.getTime() - 1000 * 60 * 60) }, // At least 1 hour ago
			)
			.getMany();

		for (const item of itemsToRestock) {
			if (item.lastRestockAt) {
				const hoursSinceRestock = (now.getTime() - item.lastRestockAt.getTime()) / (1000 * 60 * 60);
				if (hoursSinceRestock < (item.restockIntervalHours ?? 24)) {
					continue;
				}
			}

			// Restock to max
			await this.noctownShopInventoriesRepository.update(item.id, {
				stock: item.maxStock,
				lastRestockAt: now,
			});
			restockedCount++;
		}

		return restockedCount;
	}

	/**
	 * Get player's sellable items with their sell prices
	 */
	@bindThis
	public async getPlayerSellableItems(playerId: string): Promise<Array<{
		id: string;
		itemId: string;
		name: string;
		quantity: number;
		sellPrice: number;
	}>> {
		const playerItems = await this.noctownPlayerItemsRepository.find({
			where: { playerId },
			relations: ['item'],
		});

		return playerItems
			.filter(pi => pi.item !== null && pi.item.shopSellPrice !== null)
			.map(pi => ({
				id: pi.id,
				itemId: pi.item!.id,
				name: pi.item!.name,
				quantity: pi.quantity,
				sellPrice: pi.item!.shopSellPrice!,
			}));
	}
}
