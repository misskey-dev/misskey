/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable, Inject } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type {
	NoctownPlayerItemsRepository,
	NoctownItemsRepository,
	NoctownPlayersRepository,
} from '@/models/_.js';
import { IdService } from '@/core/IdService.js';

export interface PlayerItemValidationResult {
	valid: boolean;
	errorCode?: string;
	errorMessage?: string;
}

export interface AddItemResult {
	success: boolean;
	playerItemId?: string;
	newQuantity?: number;
	errorCode?: string;
	errorMessage?: string;
}

export interface RemoveItemResult {
	success: boolean;
	remainingQuantity?: number;
	errorCode?: string;
	errorMessage?: string;
}

@Injectable()
export class PlayerItemService {
	constructor(
		@Inject(DI.noctownPlayerItemsRepository)
		private playerItemsRepository: NoctownPlayerItemsRepository,

		@Inject(DI.noctownItemsRepository)
		private itemsRepository: NoctownItemsRepository,

		@Inject(DI.noctownPlayersRepository)
		private playersRepository: NoctownPlayersRepository,

		private idService: IdService,
	) {}

	/**
	 * Validate if a player can receive an item
	 */
	public async validateCanReceiveItem(
		playerId: string,
		itemId: string,
		quantity: number = 1,
	): Promise<PlayerItemValidationResult> {
		// Check if item exists
		const item = await this.itemsRepository.findOneBy({ id: itemId });
		if (!item) {
			return {
				valid: false,
				errorCode: 'ITEM_NOT_FOUND',
				errorMessage: 'Item does not exist.',
			};
		}

		// Check if player exists
		const player = await this.playersRepository.findOneBy({ id: playerId });
		if (!player) {
			return {
				valid: false,
				errorCode: 'PLAYER_NOT_FOUND',
				errorMessage: 'Player does not exist.',
			};
		}

		// Check quantity
		if (quantity < 1) {
			return {
				valid: false,
				errorCode: 'INVALID_QUANTITY',
				errorMessage: 'Quantity must be at least 1.',
			};
		}

		// Check if unique item and player already owns one
		if (item.isUnique) {
			const existingItem = await this.playerItemsRepository.findOneBy({
				playerId,
				itemId,
			});
			if (existingItem) {
				return {
					valid: false,
					errorCode: 'UNIQUE_ITEM_ALREADY_OWNED',
					errorMessage: 'Player already owns this unique item.',
				};
			}
		}

		return { valid: true };
	}

	/**
	 * Validate if a player can use/consume an item
	 */
	public async validateCanUseItem(
		playerId: string,
		itemId: string,
		quantity: number = 1,
	): Promise<PlayerItemValidationResult> {
		// Check if player owns the item
		const playerItem = await this.playerItemsRepository.findOneBy({
			playerId,
			itemId,
		});
		if (!playerItem) {
			return {
				valid: false,
				errorCode: 'ITEM_NOT_OWNED',
				errorMessage: 'Player does not own this item.',
			};
		}

		// Check quantity
		if (playerItem.quantity < quantity) {
			return {
				valid: false,
				errorCode: 'INSUFFICIENT_QUANTITY',
				errorMessage: `Not enough items. Has ${playerItem.quantity}, needs ${quantity}.`,
			};
		}

		return { valid: true };
	}

	/**
	 * Validate if a player can trade an item
	 */
	public async validateCanTradeItem(
		playerId: string,
		itemId: string,
		quantity: number = 1,
	): Promise<PlayerItemValidationResult> {
		// First check ownership
		const ownershipCheck = await this.validateCanUseItem(playerId, itemId, quantity);
		if (!ownershipCheck.valid) {
			return ownershipCheck;
		}

		// Check if item is tradeable (non-unique items are tradeable)
		const item = await this.itemsRepository.findOneBy({ id: itemId });
		if (item?.isUnique) {
			// Unique items can be traded but with special handling
			// For now, allow trading unique items
		}

		return { valid: true };
	}

	/**
	 * Add item to player's inventory
	 */
	public async addItemToPlayer(
		playerId: string,
		itemId: string,
		quantity: number = 1,
	): Promise<AddItemResult> {
		// Validate first
		const validation = await this.validateCanReceiveItem(playerId, itemId, quantity);
		if (!validation.valid) {
			return {
				success: false,
				errorCode: validation.errorCode,
				errorMessage: validation.errorMessage,
			};
		}

		// Check if player already has this item
		const existingItem = await this.playerItemsRepository.findOneBy({
			playerId,
			itemId,
		});

		if (existingItem) {
			// Increment quantity
			const newQuantity = existingItem.quantity + quantity;
			await this.playerItemsRepository.update(
				{ id: existingItem.id },
				{ quantity: newQuantity },
			);
			return {
				success: true,
				playerItemId: existingItem.id,
				newQuantity,
			};
		} else {
			// Create new entry
			const playerItemId = this.idService.gen();
			await this.playerItemsRepository.insert({
				id: playerItemId,
				playerId,
				itemId,
				quantity,
			});
			return {
				success: true,
				playerItemId,
				newQuantity: quantity,
			};
		}
	}

	/**
	 * Remove item from player's inventory
	 */
	public async removeItemFromPlayer(
		playerId: string,
		itemId: string,
		quantity: number = 1,
	): Promise<RemoveItemResult> {
		// Validate first
		const validation = await this.validateCanUseItem(playerId, itemId, quantity);
		if (!validation.valid) {
			return {
				success: false,
				errorCode: validation.errorCode,
				errorMessage: validation.errorMessage,
			};
		}

		const playerItem = await this.playerItemsRepository.findOneBy({
			playerId,
			itemId,
		});

		if (!playerItem) {
			return {
				success: false,
				errorCode: 'ITEM_NOT_OWNED',
				errorMessage: 'Player does not own this item.',
			};
		}

		const remainingQuantity = playerItem.quantity - quantity;

		if (remainingQuantity <= 0) {
			// Delete the entry
			await this.playerItemsRepository.delete({ id: playerItem.id });
			return {
				success: true,
				remainingQuantity: 0,
			};
		} else {
			// Update quantity
			await this.playerItemsRepository.update(
				{ id: playerItem.id },
				{ quantity: remainingQuantity },
			);
			return {
				success: true,
				remainingQuantity,
			};
		}
	}

	/**
	 * Transfer item between players
	 */
	public async transferItem(
		fromPlayerId: string,
		toPlayerId: string,
		itemId: string,
		quantity: number = 1,
	): Promise<{ success: boolean; errorCode?: string; errorMessage?: string }> {
		// Validate sender can trade
		const senderValidation = await this.validateCanTradeItem(fromPlayerId, itemId, quantity);
		if (!senderValidation.valid) {
			return {
				success: false,
				errorCode: senderValidation.errorCode,
				errorMessage: senderValidation.errorMessage,
			};
		}

		// Validate receiver can receive
		const item = await this.itemsRepository.findOneBy({ id: itemId });
		if (item?.isUnique) {
			// For unique items, check if receiver already has one
			const receiverItem = await this.playerItemsRepository.findOneBy({
				playerId: toPlayerId,
				itemId,
			});
			if (receiverItem) {
				return {
					success: false,
					errorCode: 'UNIQUE_ITEM_ALREADY_OWNED',
					errorMessage: 'Recipient already owns this unique item.',
				};
			}
		}

		// Remove from sender
		const removeResult = await this.removeItemFromPlayer(fromPlayerId, itemId, quantity);
		if (!removeResult.success) {
			return {
				success: false,
				errorCode: removeResult.errorCode,
				errorMessage: removeResult.errorMessage,
			};
		}

		// Add to receiver (bypass unique check since we already validated)
		const existingItem = await this.playerItemsRepository.findOneBy({
			playerId: toPlayerId,
			itemId,
		});

		if (existingItem) {
			await this.playerItemsRepository.update(
				{ id: existingItem.id },
				{ quantity: existingItem.quantity + quantity },
			);
		} else {
			await this.playerItemsRepository.insert({
				id: this.idService.gen(),
				playerId: toPlayerId,
				itemId,
				quantity,
			});
		}

		return { success: true };
	}

	/**
	 * Get player's inventory with item details
	 */
	public async getPlayerInventory(playerId: string): Promise<Array<{
		playerItemId: string;
		itemId: string;
		itemName: string;
		itemType: string;
		rarity: number;
		quantity: number;
		isUnique: boolean;
		imageUrl: string | null;
	}>> {
		const playerItems = await this.playerItemsRepository.find({
			where: { playerId },
			relations: ['item'],
		});

		return playerItems.map(pi => ({
			playerItemId: pi.id,
			itemId: pi.itemId,
			itemName: pi.item?.name ?? 'Unknown',
			itemType: pi.item?.itemType ?? 'normal',
			rarity: pi.item?.rarity ?? 0,
			quantity: pi.quantity,
			isUnique: pi.item?.isUnique ?? false,
			imageUrl: pi.item?.imageUrl ?? null,
		}));
	}

	/**
	 * Get count of a specific item a player owns
	 */
	public async getPlayerItemCount(playerId: string, itemId: string): Promise<number> {
		const playerItem = await this.playerItemsRepository.findOneBy({
			playerId,
			itemId,
		});
		return playerItem?.quantity ?? 0;
	}

	/**
	 * Check if player owns a specific item
	 */
	public async playerOwnsItem(playerId: string, itemId: string): Promise<boolean> {
		const count = await this.getPlayerItemCount(playerId, itemId);
		return count > 0;
	}

	/**
	 * Get all unique items a player owns
	 */
	public async getPlayerUniqueItems(playerId: string): Promise<Array<{
		itemId: string;
		itemName: string;
	}>> {
		const playerItems = await this.playerItemsRepository.find({
			where: { playerId },
			relations: ['item'],
		});

		return playerItems
			.filter(pi => pi.item?.isUnique)
			.map(pi => ({
				itemId: pi.itemId,
				itemName: pi.item?.name ?? 'Unknown',
			}));
	}
}
