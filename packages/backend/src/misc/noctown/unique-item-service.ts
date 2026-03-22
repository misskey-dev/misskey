/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable, Inject } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type {
	NoctownUniqueItemsRepository,
	NoctownItemsRepository,
	NoctownPlayerItemsRepository,
	NoctownPlayersRepository,
} from '@/models/_.js';
import type { OwnershipHistoryEntry } from '@/models/noctown/NoctownUniqueItem.js';

export interface UniqueItemTransferResult {
	success: boolean;
	errorCode?: string;
	errorMessage?: string;
}

export interface UniqueItemInfo {
	id: string;
	itemId: string;
	itemName: string;
	serialNumber: string;
	currentOwnerId: string | null;
	currentOwnerName: string | null;
	originMethod: string;
	isTradeable: boolean;
	isObtainable: boolean;
	ownershipHistory: OwnershipHistoryEntry[];
	firstObtainedAt: Date | null;
}

/**
 * Unique item service for Noctown.
 * Handles unique item management, transfer, and duplication prevention.
 */
@Injectable()
export class UniqueItemService {
	constructor(
		@Inject(DI.noctownUniqueItemsRepository)
		private uniqueItemsRepository: NoctownUniqueItemsRepository,

		@Inject(DI.noctownItemsRepository)
		private itemsRepository: NoctownItemsRepository,

		@Inject(DI.noctownPlayerItemsRepository)
		private playerItemsRepository: NoctownPlayerItemsRepository,

		@Inject(DI.noctownPlayersRepository)
		private playersRepository: NoctownPlayersRepository,
	) {}

	/**
	 * Check if a unique item can be given to a player
	 * Returns false if:
	 * - Item is already owned
	 * - Player already has another instance of this unique item
	 * - Item is not obtainable
	 */
	public async canPlayerObtainUniqueItem(
		playerId: string,
		uniqueItemId: string,
	): Promise<{ canObtain: boolean; reason?: string }> {
		const uniqueItem = await this.uniqueItemsRepository.findOne({
			where: { id: uniqueItemId },
			relations: ['item'],
		});

		if (!uniqueItem) {
			return { canObtain: false, reason: 'Unique item not found' };
		}

		// Check if already owned
		if (uniqueItem.currentOwnerId !== null) {
			return { canObtain: false, reason: 'Item already has an owner' };
		}

		// Check if obtainable
		if (!uniqueItem.isObtainable) {
			return { canObtain: false, reason: 'Item is not currently obtainable' };
		}

		// Check if player already owns any instance of this item type
		const existingPlayerItem = await this.playerItemsRepository.findOneBy({
			playerId,
			itemId: uniqueItem.itemId,
		});

		if (existingPlayerItem) {
			return { canObtain: false, reason: 'Player already owns this unique item type' };
		}

		return { canObtain: true };
	}

	/**
	 * Transfer unique item to a player
	 */
	public async transferToPlayer(
		uniqueItemId: string,
		toPlayerId: string,
		method: 'gacha' | 'quest' | 'craft' | 'trade' | 'admin' | 'event',
	): Promise<UniqueItemTransferResult> {
		const canObtain = await this.canPlayerObtainUniqueItem(toPlayerId, uniqueItemId);
		if (!canObtain.canObtain) {
			return {
				success: false,
				errorCode: 'CANNOT_OBTAIN',
				errorMessage: canObtain.reason,
			};
		}

		const uniqueItem = await this.uniqueItemsRepository.findOneBy({ id: uniqueItemId });
		if (!uniqueItem) {
			return {
				success: false,
				errorCode: 'UNIQUE_ITEM_NOT_FOUND',
				errorMessage: 'Unique item not found',
			};
		}

		const player = await this.playersRepository.findOneBy({ id: toPlayerId });
		if (!player) {
			return {
				success: false,
				errorCode: 'PLAYER_NOT_FOUND',
				errorMessage: 'Player not found',
			};
		}

		// Add to ownership history
		const history: OwnershipHistoryEntry[] = uniqueItem.ownershipHistory ?? [];
		history.push({
			playerId: toPlayerId,
			acquiredAt: new Date().toISOString(),
			method,
		});

		// Update unique item record
		await this.uniqueItemsRepository.update(
			{ id: uniqueItemId },
			{
				currentOwnerId: toPlayerId,
				ownershipHistory: history,
				isObtainable: false, // Once obtained, not obtainable again
				firstObtainedAt: uniqueItem.firstObtainedAt ?? new Date(),
				updatedAt: new Date(),
			},
		);

		return { success: true };
	}

	/**
	 * Transfer unique item from one player to another (trade)
	 */
	public async transferBetweenPlayers(
		uniqueItemId: string,
		fromPlayerId: string,
		toPlayerId: string,
	): Promise<UniqueItemTransferResult> {
		const uniqueItem = await this.uniqueItemsRepository.findOneBy({ id: uniqueItemId });
		if (!uniqueItem) {
			return {
				success: false,
				errorCode: 'UNIQUE_ITEM_NOT_FOUND',
				errorMessage: 'Unique item not found',
			};
		}

		// Verify current owner
		if (uniqueItem.currentOwnerId !== fromPlayerId) {
			return {
				success: false,
				errorCode: 'NOT_OWNER',
				errorMessage: 'Player does not own this unique item',
			};
		}

		// Check if tradeable
		if (!uniqueItem.isTradeable) {
			return {
				success: false,
				errorCode: 'NOT_TRADEABLE',
				errorMessage: 'This unique item cannot be traded',
			};
		}

		// Check if recipient already has this item type
		const recipientHasItem = await this.playerItemsRepository.findOneBy({
			playerId: toPlayerId,
			itemId: uniqueItem.itemId,
		});

		if (recipientHasItem) {
			return {
				success: false,
				errorCode: 'RECIPIENT_ALREADY_OWNS',
				errorMessage: 'Recipient already owns this unique item type',
			};
		}

		// Update ownership history
		const history: OwnershipHistoryEntry[] = uniqueItem.ownershipHistory ?? [];

		// Mark previous owner's release
		const lastEntry = history[history.length - 1];
		if (lastEntry && lastEntry.playerId === fromPlayerId && !lastEntry.releasedAt) {
			lastEntry.releasedAt = new Date().toISOString();
		}

		// Add new owner
		history.push({
			playerId: toPlayerId,
			acquiredAt: new Date().toISOString(),
			method: 'trade',
		});

		// Update unique item record
		await this.uniqueItemsRepository.update(
			{ id: uniqueItemId },
			{
				currentOwnerId: toPlayerId,
				ownershipHistory: history,
				updatedAt: new Date(),
			},
		);

		return { success: true };
	}

	/**
	 * Remove unique item from a player (admin action)
	 */
	public async removeFromPlayer(
		uniqueItemId: string,
		playerId: string,
	): Promise<UniqueItemTransferResult> {
		const uniqueItem = await this.uniqueItemsRepository.findOneBy({ id: uniqueItemId });
		if (!uniqueItem) {
			return {
				success: false,
				errorCode: 'UNIQUE_ITEM_NOT_FOUND',
				errorMessage: 'Unique item not found',
			};
		}

		if (uniqueItem.currentOwnerId !== playerId) {
			return {
				success: false,
				errorCode: 'NOT_OWNER',
				errorMessage: 'Player does not own this unique item',
			};
		}

		// Update ownership history
		const history: OwnershipHistoryEntry[] = uniqueItem.ownershipHistory ?? [];
		const lastEntry = history[history.length - 1];
		if (lastEntry && lastEntry.playerId === playerId && !lastEntry.releasedAt) {
			lastEntry.releasedAt = new Date().toISOString();
		}

		// Update unique item record
		await this.uniqueItemsRepository.update(
			{ id: uniqueItemId },
			{
				currentOwnerId: null,
				ownershipHistory: history,
				isObtainable: true, // Can be obtained again
				updatedAt: new Date(),
			},
		);

		return { success: true };
	}

	/**
	 * Get unique item info with ownership details
	 */
	public async getUniqueItemInfo(uniqueItemId: string): Promise<UniqueItemInfo | null> {
		const uniqueItem = await this.uniqueItemsRepository.findOne({
			where: { id: uniqueItemId },
			relations: ['item', 'currentOwner'],
		});

		if (!uniqueItem) {
			return null;
		}

		return {
			id: uniqueItem.id,
			itemId: uniqueItem.itemId,
			itemName: uniqueItem.item?.name ?? 'Unknown',
			serialNumber: uniqueItem.serialNumber,
			currentOwnerId: uniqueItem.currentOwnerId,
			currentOwnerName: null, // Would need player to user lookup
			originMethod: uniqueItem.originMethod,
			isTradeable: uniqueItem.isTradeable,
			isObtainable: uniqueItem.isObtainable,
			ownershipHistory: uniqueItem.ownershipHistory ?? [],
			firstObtainedAt: uniqueItem.firstObtainedAt,
		};
	}

	/**
	 * Get all unique items owned by a player
	 */
	public async getPlayerUniqueItems(playerId: string): Promise<UniqueItemInfo[]> {
		const uniqueItems = await this.uniqueItemsRepository.find({
			where: { currentOwnerId: playerId },
			relations: ['item'],
		});

		return uniqueItems.map(ui => ({
			id: ui.id,
			itemId: ui.itemId,
			itemName: ui.item?.name ?? 'Unknown',
			serialNumber: ui.serialNumber,
			currentOwnerId: ui.currentOwnerId,
			currentOwnerName: null,
			originMethod: ui.originMethod,
			isTradeable: ui.isTradeable,
			isObtainable: ui.isObtainable,
			ownershipHistory: ui.ownershipHistory ?? [],
			firstObtainedAt: ui.firstObtainedAt,
		}));
	}

	/**
	 * Check if a player owns any unique items of a specific base item
	 */
	public async playerOwnsUniqueItemType(
		playerId: string,
		itemId: string,
	): Promise<boolean> {
		const count = await this.uniqueItemsRepository.count({
			where: {
				itemId,
				currentOwnerId: playerId,
			},
		});
		return count > 0;
	}

	/**
	 * Get all obtainable unique items (for display in gacha/quest rewards)
	 */
	public async getObtainableUniqueItems(): Promise<UniqueItemInfo[]> {
		const uniqueItems = await this.uniqueItemsRepository.find({
			where: { isObtainable: true },
			relations: ['item'],
		});

		return uniqueItems.map(ui => ({
			id: ui.id,
			itemId: ui.itemId,
			itemName: ui.item?.name ?? 'Unknown',
			serialNumber: ui.serialNumber,
			currentOwnerId: ui.currentOwnerId,
			currentOwnerName: null,
			originMethod: ui.originMethod,
			isTradeable: ui.isTradeable,
			isObtainable: ui.isObtainable,
			ownershipHistory: ui.ownershipHistory ?? [],
			firstObtainedAt: ui.firstObtainedAt,
		}));
	}
}
