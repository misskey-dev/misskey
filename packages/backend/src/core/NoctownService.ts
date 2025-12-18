/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Not, LessThan } from 'typeorm';
import { DI } from '@/di-symbols.js';
import { bindThis } from '@/decorators.js';
import { IdService } from '@/core/IdService.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import { getChunkGenerator } from '@/misc/noctown/chunk-generator.js';
import type {
	NoctownPlayersRepository,
	NoctownPlayerItemsRepository,
	NoctownPlacedItemsRepository,
	NoctownDroppedItemsRepository,
	NoctownWalletsRepository,
	NoctownPlayerScoresRepository,
	NoctownPlayerStatisticsRepository,
	NoctownItemsRepository,
	NoctownQuestsRepository,
	NoctownNpcsRepository,
	NoctownFarmPlotsRepository,
	NoctownCropsRepository,
	NoctownChickensRepository,
	NoctownCowsRepository,
	NoctownHousesRepository,
	NoctownWorldChunksRepository,
	NoctownChatLogsRepository,
	NoctownChatLogRecipientsRepository,
	UsersRepository,
} from '@/models/_.js';
import type { NoctownCropStage } from '@/models/noctown/NoctownCrop.js';
import type { NoctownQuestType, NoctownQuestStatus } from '@/models/noctown/NoctownQuest.js';
import type { NoctownPlayer } from '@/models/noctown/NoctownPlayer.js';
import type { MiUser } from '@/models/User.js';
import { NoctownTransactionService } from '@/core/NoctownTransactionService.js';
import type { NoctownTransactionState } from '@/models/noctown/NoctownTransactionLog.js';

@Injectable()
export class NoctownService {
	constructor(
		@Inject(DI.noctownPlayersRepository)
		private noctownPlayersRepository: NoctownPlayersRepository,

		@Inject(DI.noctownPlayerItemsRepository)
		private noctownPlayerItemsRepository: NoctownPlayerItemsRepository,

		@Inject(DI.noctownPlacedItemsRepository)
		private noctownPlacedItemsRepository: NoctownPlacedItemsRepository,

		@Inject(DI.noctownDroppedItemsRepository)
		private noctownDroppedItemsRepository: NoctownDroppedItemsRepository,

		@Inject(DI.noctownWalletsRepository)
		private noctownWalletsRepository: NoctownWalletsRepository,

		@Inject(DI.noctownPlayerScoresRepository)
		private noctownPlayerScoresRepository: NoctownPlayerScoresRepository,

		@Inject(DI.noctownPlayerStatisticsRepository)
		private noctownPlayerStatisticsRepository: NoctownPlayerStatisticsRepository,

		@Inject(DI.noctownItemsRepository)
		private noctownItemsRepository: NoctownItemsRepository,

		@Inject(DI.noctownQuestsRepository)
		private noctownQuestsRepository: NoctownQuestsRepository,

		@Inject(DI.noctownNpcsRepository)
		private noctownNpcsRepository: NoctownNpcsRepository,

		@Inject(DI.noctownFarmPlotsRepository)
		private noctownFarmPlotsRepository: NoctownFarmPlotsRepository,

		@Inject(DI.noctownCropsRepository)
		private noctownCropsRepository: NoctownCropsRepository,

		@Inject(DI.noctownChickensRepository)
		private noctownChickensRepository: NoctownChickensRepository,

		@Inject(DI.noctownCowsRepository)
		private noctownCowsRepository: NoctownCowsRepository,

		@Inject(DI.noctownHousesRepository)
		private noctownHousesRepository: NoctownHousesRepository,

		@Inject(DI.noctownWorldChunksRepository)
		private noctownWorldChunksRepository: NoctownWorldChunksRepository,

		@Inject(DI.noctownChatLogsRepository)
		private noctownChatLogsRepository: NoctownChatLogsRepository,

		// FR-029: チャット履歴記録用の中間テーブルRepository
		@Inject(DI.noctownChatLogRecipientsRepository)
		private noctownChatLogRecipientsRepository: NoctownChatLogRecipientsRepository,

		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		private idService: IdService,
		private globalEventService: GlobalEventService,
		private noctownTransactionService: NoctownTransactionService,
	) {}

	@bindThis
	public async createPlayer(userId: MiUser['id']): Promise<NoctownPlayer> {
		const playerId = this.idService.gen();

		// Create player record
		// Note: positionY is set to 0 (ground level), will be auto-corrected to proper height on first spawn
		const player = await this.noctownPlayersRepository.insertOne({
			id: playerId,
			userId,
			positionX: 0,
			positionY: 0, // T015: Set to 0 (ground level)
			positionZ: 0,
			rotation: 0,
			isOnline: false,
			lastActiveAt: new Date(),
			createdAt: new Date(),
		});

		// Create wallet
		await this.noctownWalletsRepository.insert({
			id: this.idService.gen(),
			playerId,
			balance: '0',
			updatedAt: new Date(),
		});

		// Create statistics
		await this.noctownPlayerStatisticsRepository.insert({
			id: this.idService.gen(),
			playerId,
			questsCompleted: 0,
			totalQuestTimeSeconds: '0',
			totalPlayTimeSeconds: '0',
			updatedAt: new Date(),
		});

		// Create score
		await this.noctownPlayerScoresRepository.insert({
			id: this.idService.gen(),
			playerId,
			balanceScore: 0,
			itemScore: 0,
			questScore: 0,
			speedScore: 0,
			totalScore: 0,
			calculatedAt: new Date(),
		});

		// Grant starter kit
		await this.grantStarterKit(playerId);

		return player;
	}

	@bindThis
	private async grantStarterKit(playerId: string): Promise<void> {
		// Starter kit definition: 木材x10, 石x5, 種袋x5, 斧x1, 500ノクタコイン
		const starterItems = [
			{ name: '木材', flavorText: '木材。様々なアイテムの材料になる。', quantity: 10 },
			{ name: '石', flavorText: '石。様々なアイテムの材料になる。', quantity: 5 },
			{ name: '種袋', flavorText: '野菜の種が入った袋。畑に植えて育てよう。', quantity: 5 },
			{ name: '斧', flavorText: '木を伐採するための斧。木材を集めるのに必要。', quantity: 1 },
		];

		for (const starterItem of starterItems) {
			// Find or create the item
			let item = await this.noctownItemsRepository.findOneBy({ name: starterItem.name });
			if (!item) {
				item = await this.noctownItemsRepository.save({
					id: this.idService.gen(),
					name: starterItem.name,
					flavorText: starterItem.flavorText,
					imageUrl: null,
					fullImageUrl: null,
					rarity: starterItem.name === '斧' ? 1 : 0,
					itemType: starterItem.name === '斧' ? 'tool' : (starterItem.name === '種袋' ? 'seed' : 'normal'),
					isUnique: false,
					isPlayerCreated: false,
					creatorId: null,
					shopPrice: null,
					shopSellPrice: starterItem.name === '斧' ? 30 : (starterItem.name === '種袋' ? 15 : 5),
				});
			}

			// Add item to player inventory
			await this.noctownPlayerItemsRepository.insert({
				id: this.idService.gen(),
				playerId,
				itemId: item.id,
				quantity: starterItem.quantity,
				acquiredAt: new Date(),
			});
		}

		// Grant 500 ノクタコイン
		await this.noctownWalletsRepository.update(
			{ playerId },
			{ balance: '500' },
		);
	}

	@bindThis
	public async setPlayerOnline(playerId: string, userId: string): Promise<void> {
		await this.noctownPlayersRepository.update(playerId, {
			isOnline: true,
			lastActiveAt: new Date(),
		});

		// FR-010: 完全なプレイヤーデータを取得して送信
		const player = await this.noctownPlayersRepository.findOneBy({ id: playerId });
		if (!player) return;

		const user = await this.usersRepository.findOneBy({ id: userId });

		// FR-007: プレイヤー参加イベントを送信（フロントエンドのplayerJoinedリスナーと一致）
		this.globalEventService.publishNoctownStream('playerJoined', {
			id: playerId,
			playerId,
			userId,
			username: user?.username ?? '',
			name: user?.name ?? null,
			avatarUrl: user?.avatarUrl ?? null,
			positionX: player.positionX,
			positionY: player.positionY,
			positionZ: player.positionZ,
			rotation: player.rotation,
			isOnline: true,
		});
	}

	@bindThis
	public async updatePlayerPosition(
		playerId: string,
		userId: string,
		x: number,
		y: number,
		z: number,
		rotation: number | null,
	): Promise<void> {
		// FR-007-4: プレイヤーがオフライン状態の場合、移動時にオンライン化して他のプレイヤーに表示
		const player = await this.noctownPlayersRepository.findOneBy({ id: playerId });
		const wasOffline = player && !player.isOnline;

		await this.noctownPlayersRepository.update(playerId, {
			positionX: x,
			positionY: y,
			positionZ: z,
			...(rotation != null ? { rotation } : {}),
			isOnline: true, // 移動時は必ずオンライン化
			lastActiveAt: new Date(),
		});

		// オフラインからオンラインに変わった場合は playerJoined イベントを送信（フロントエンドと統一）
		if (wasOffline) {
			// FR-010: ユーザー情報を取得
			const user = await this.usersRepository.findOneBy({ id: userId });

			this.globalEventService.publishNoctownStream('playerJoined', {
				id: playerId,
				playerId,
				userId,
				username: user?.username ?? '',
				name: user?.name ?? null,
				avatarUrl: user?.avatarUrl ?? null,
				positionX: x,
				positionY: y,
				positionZ: z,
				rotation: rotation ?? 0,
				isOnline: true,
			});
		}

		// FR-010: ユーザー情報を取得
		const user = await this.usersRepository.findOneBy({ id: userId });

		this.globalEventService.publishNoctownStream('playerMoved', {
			id: playerId, // プレイヤー識別子 - フロントエンドで自分のプレイヤーかどうか判定するために使用
			playerId, // 後方互換性のため残す
			userId,
			username: user?.username ?? '',
			name: user?.name ?? null,
			avatarUrl: user?.avatarUrl ?? null,
			positionX: x,
			positionY: y,
			positionZ: z,
			rotation: rotation ?? 0,
			isOnline: true,
		});
	}

	@bindThis
	// 仕様: FR-030 ドロップアイテムの拾得
	// 仕様: FR-034 トランザクションログ統合
	// ドロップアイテムの数量を考慮してインベントリに追加
	// 通貨アイテムの場合はウォレットに加算
	public async pickUpItem(playerId: string, droppedItemId: string): Promise<boolean> {
		// Find the dropped item
		const droppedItem = await this.noctownDroppedItemsRepository.findOneBy({ id: droppedItemId });
		if (!droppedItem) return false;

		// 仕様: ドロップアイテムの数量（デフォルト1）
		const pickupQuantity = droppedItem.quantity ?? 1;

		// 仕様: FR-034 beforeState を記録
		const beforeState: NoctownTransactionState = {
			location: 'ground',
			status: 'dropped',
			ownerId: droppedItem.droppedByPlayerId ?? undefined,
			quantity: pickupQuantity,
			version: droppedItem.version,
			positionX: droppedItem.positionX,
			positionY: droppedItem.positionY,
			positionZ: droppedItem.positionZ,
		};

		// アイテム情報を取得してタイプを確認
		const item = await this.noctownItemsRepository.findOneBy({ id: droppedItem.itemId });

		// 仕様: 通貨アイテムの場合はウォレットに加算
		if (item && item.itemType === 'currency') {
			const wallet = await this.noctownWalletsRepository.findOneBy({ playerId });
			if (wallet) {
				const currentBalance = Number(wallet.balance);
				await this.noctownWalletsRepository.update(
					{ playerId },
					{
						balance: String(currentBalance + pickupQuantity),
						updatedAt: new Date(),
					},
				);

				// 仕様: FR-034 通貨拾得のトランザクションログ
				await this.noctownTransactionService.createLog(
					'CURRENCY_DEPOSIT',
					playerId,
					droppedItemId,
					pickupQuantity,
					beforeState,
					{
						location: 'inventory',
						status: 'picked_up',
						ownerId: playerId,
						quantity: currentBalance + pickupQuantity,
					},
					{ itemId: droppedItem.itemId, balanceBefore: currentBalance, balanceAfter: currentBalance + pickupQuantity },
					droppedItem.droppedByPlayerId,
				);
			}
			// Remove dropped item from map
			await this.noctownDroppedItemsRepository.delete(droppedItemId);

			// Broadcast item pickup
			this.globalEventService.publishNoctownStream('itemPicked', {
				playerId,
				droppedItemId,
				itemId: droppedItem.itemId,
			});

			return true;
		} else {
			// 通常アイテムの場合はインベントリに追加
			// Check if player already has this item type
			const existingPlayerItem = await this.noctownPlayerItemsRepository.findOneBy({
				playerId,
				itemId: droppedItem.itemId,
			});

			// Check inventory capacity (max 300 unique item types)
			if (!existingPlayerItem) {
				const INVENTORY_MAX_CAPACITY = 300;
				const currentItemCount = await this.noctownPlayerItemsRepository.count({
					where: { playerId },
				});
				if (currentItemCount >= INVENTORY_MAX_CAPACITY) {
					return false; // Inventory full
				}
			}

			if (existingPlayerItem) {
				// Increment quantity by dropped item's quantity
				await this.noctownPlayerItemsRepository.update(existingPlayerItem.id, {
					quantity: existingPlayerItem.quantity + pickupQuantity,
				});
			} else {
				// Add new item to inventory with dropped quantity
				await this.noctownPlayerItemsRepository.insert({
					id: this.idService.gen(),
					playerId,
					itemId: droppedItem.itemId,
					quantity: pickupQuantity,
					acquiredAt: new Date(),
				});
			}
		}

		// Remove dropped item from map
		await this.noctownDroppedItemsRepository.delete(droppedItemId);

		// 仕様: FR-034 afterState を記録しトランザクションログを作成
		const afterState: NoctownTransactionState = {
			location: 'inventory',
			status: 'picked_up',
			ownerId: playerId,
			quantity: pickupQuantity,
		};

		await this.noctownTransactionService.createLog(
			'ITEM_PICKUP',
			playerId,
			droppedItemId,
			pickupQuantity,
			beforeState,
			afterState,
			{ itemId: droppedItem.itemId, itemType: item?.itemType },
			droppedItem.droppedByPlayerId,
		);

		// Broadcast item pickup
		this.globalEventService.publishNoctownStream('itemPicked', {
			playerId,
			droppedItemId,
			itemId: droppedItem.itemId,
		});

		return true;
	}

	// 仕様: FR-030 インベントリからアイテムをドロップ
	// 仕様: FR-034 トランザクションログ統合
	// プレイヤーがインベントリからアイテムを地面に捨てる
	@bindThis
	public async dropItemFromInventory(
		playerId: string,
		playerItemId: string,
		quantity: number,
		x: number,
		y: number,
		z: number,
	): Promise<{ droppedItemId: string } | null> {
		// Find the player item
		const playerItem = await this.noctownPlayerItemsRepository.findOne({
			where: { id: playerItemId, playerId },
			relations: ['item'],
		});
		if (!playerItem || !playerItem.item) return null;

		// 仕様: 要求された数量がインベントリの数量を超えていないか確認
		const dropQuantity = Math.min(quantity, playerItem.quantity);
		if (dropQuantity <= 0) return null;

		// 仕様: FR-034 beforeState を記録
		const beforeState: NoctownTransactionState = {
			location: 'inventory',
			status: 'active',
			ownerId: playerId,
			quantity: playerItem.quantity,
			version: playerItem.version,
			itemType: playerItem.item.itemType,
		};

		// Create dropped item on the ground
		const droppedItemId = this.idService.gen();
		await this.noctownDroppedItemsRepository.insert({
			id: droppedItemId,
			itemId: playerItem.itemId,
			droppedByPlayerId: playerId,
			quantity: dropQuantity,
			positionX: x,
			positionY: y,
			positionZ: z,
			droppedAt: new Date(),
		});

		// Decrement or remove from inventory
		if (playerItem.quantity > dropQuantity) {
			await this.noctownPlayerItemsRepository.update(playerItemId, {
				quantity: playerItem.quantity - dropQuantity,
			});
		} else {
			await this.noctownPlayerItemsRepository.delete(playerItemId);
		}

		// 仕様: FR-034 afterState を記録しトランザクションログを作成
		const afterState: NoctownTransactionState = {
			location: 'ground',
			status: 'dropped',
			ownerId: playerId,
			quantity: dropQuantity,
			positionX: x,
			positionY: y,
			positionZ: z,
		};

		await this.noctownTransactionService.createLog(
			'ITEM_DROP',
			playerId,
			droppedItemId,
			dropQuantity,
			beforeState,
			afterState,
			{ itemId: playerItem.itemId, playerItemId, itemType: playerItem.item.itemType },
		);

		// Broadcast item drop
		// 仕様: フロントエンドのDroppedItemData型に合わせたフィールド名で送信
		this.globalEventService.publishNoctownStream('itemDropped', {
			id: droppedItemId,
			playerId,
			itemId: playerItem.itemId,
			itemName: playerItem.item.name,
			itemType: playerItem.item.itemType,
			emoji: playerItem.item.emoji,
			imageUrl: playerItem.item.imageUrl,
			rarity: playerItem.item.rarity,
			quantity: dropQuantity,
			positionX: x,
			positionY: y,
			positionZ: z,
		});

		return { droppedItemId };
	}

	// 仕様: ウォレットからノクタコインを地面にドロップ
	// 仕様: FR-034 トランザクションログ統合
	@bindThis
	public async dropCurrencyFromWallet(
		playerId: string,
		amount: number,
		x: number,
		y: number,
		z: number,
	): Promise<{ droppedItemId: string } | null> {
		// Find the wallet
		const wallet = await this.noctownWalletsRepository.findOneBy({ playerId });
		if (!wallet) return null;

		const currentBalance = Number(wallet.balance);
		if (amount <= 0 || amount > currentBalance) return null;

		// 仕様: FR-034 beforeState を記録
		const beforeState: NoctownTransactionState = {
			location: 'inventory',
			status: 'active',
			ownerId: playerId,
			quantity: currentBalance,
		};

		// Find or create the "ノクタコイン" item
		let coinItem = await this.noctownItemsRepository.findOneBy({ itemType: 'currency' });
		if (!coinItem) {
			// Create currency item if it doesn't exist
			const coinItemId = this.idService.gen();
			await this.noctownItemsRepository.insert({
				id: coinItemId,
				name: 'ノクタコイン',
				itemType: 'currency',
				rarity: 1,
				emoji: '🪙',
				imageUrl: null,
				flavorText: 'ノクタウンの通貨',
				shopPrice: null,
				shopSellPrice: null,
				createdAt: new Date(),
			});
			coinItem = await this.noctownItemsRepository.findOneBy({ id: coinItemId });
		}
		if (!coinItem) return null;

		// Create dropped currency on the ground
		const droppedItemId = this.idService.gen();
		await this.noctownDroppedItemsRepository.insert({
			id: droppedItemId,
			itemId: coinItem.id,
			droppedByPlayerId: playerId,
			quantity: amount,
			positionX: x,
			positionY: y,
			positionZ: z,
			droppedAt: new Date(),
		});

		// Deduct from wallet
		await this.noctownWalletsRepository.update(
			{ playerId },
			{
				balance: String(currentBalance - amount),
				updatedAt: new Date(),
			},
		);

		// 仕様: FR-034 afterState を記録しトランザクションログを作成
		const afterState: NoctownTransactionState = {
			location: 'ground',
			status: 'dropped',
			ownerId: playerId,
			quantity: amount,
			positionX: x,
			positionY: y,
			positionZ: z,
		};

		await this.noctownTransactionService.createLog(
			'CURRENCY_WITHDRAW',
			playerId,
			droppedItemId,
			amount,
			beforeState,
			afterState,
			{ coinItemId: coinItem.id, balanceBefore: currentBalance, balanceAfter: currentBalance - amount },
		);

		// Broadcast currency drop
		// 仕様: フロントエンドのDroppedItemData型に合わせたフィールド名で送信
		this.globalEventService.publishNoctownStream('itemDropped', {
			id: droppedItemId,
			playerId,
			itemId: coinItem.id,
			itemName: coinItem.name,
			itemType: 'currency',
			emoji: coinItem.emoji,
			imageUrl: coinItem.imageUrl,
			rarity: coinItem.rarity,
			quantity: amount,
			positionX: x,
			positionY: y,
			positionZ: z,
		});

		return { droppedItemId };
	}

	// 仕様: FR-034 トランザクションログ統合
	@bindThis
	public async placeItem(
		playerId: string,
		playerItemId: string,
		x: number,
		y: number,
		z: number,
		rotation: number,
	): Promise<{ success: boolean; error?: 'not_found' | 'not_placeable' | 'limit_reached'; placedItemId?: string }> {
		// Find the player item
		const playerItem = await this.noctownPlayerItemsRepository.findOne({
			where: { id: playerItemId, playerId },
			relations: ['item'],
		});
		if (!playerItem || !playerItem.item) return { success: false, error: 'not_found' };

		// 仕様: FR-032 設置可能なアイテムタイプを判定
		// placeable, stone, rock, wood, log, axe, fishing_rod, furniture, decoration は設置可能
		const placeableTypes = ['placeable', 'stone', 'rock', 'wood', 'log', 'axe', 'fishing_rod', 'furniture', 'decoration'];
		if (!placeableTypes.includes(playerItem.item.itemType)) return { success: false, error: 'not_placeable' };

		// 仕様: FR-032 設置上限100個/プレイヤー
		const placedCount = await this.noctownPlacedItemsRepository.countBy({ playerId });
		if (placedCount >= 100) return { success: false, error: 'limit_reached' };

		// 仕様: FR-034 beforeState を記録
		const beforeState: NoctownTransactionState = {
			location: 'inventory',
			status: 'active',
			ownerId: playerId,
			quantity: playerItem.quantity,
			version: playerItem.version,
			itemType: playerItem.item.itemType,
		};

		// Decrement or remove from inventory
		if (playerItem.quantity > 1) {
			await this.noctownPlayerItemsRepository.update(playerItemId, {
				quantity: playerItem.quantity - 1,
			});
		} else {
			await this.noctownPlayerItemsRepository.delete(playerItemId);
		}

		// Create placed item
		const placedItemId = this.idService.gen();
		await this.noctownPlacedItemsRepository.insert({
			id: placedItemId,
			playerId,
			itemId: playerItem.itemId,
			positionX: x,
			positionY: y,
			positionZ: z,
			rotation,
			placedAt: new Date(),
		});

		// 仕様: FR-034 afterState を記録しトランザクションログを作成
		const afterState: NoctownTransactionState = {
			location: 'map',
			status: 'placed',
			ownerId: playerId,
			quantity: 1,
			positionX: x,
			positionY: y,
			positionZ: z,
		};

		await this.noctownTransactionService.createLog(
			'ITEM_PLACE',
			playerId,
			placedItemId,
			1,
			beforeState,
			afterState,
			{ itemId: playerItem.itemId, playerItemId, itemType: playerItem.item.itemType, rotation },
		);

		// Broadcast item placement
		this.globalEventService.publishNoctownStream('itemPlaced', {
			playerId,
			placedItemId,
			itemId: playerItem.itemId,
			x,
			y,
			z,
			rotation,
		});

		return { success: true, placedItemId };
	}

	@bindThis
	public async interact(playerId: string, targetType: string, targetId: string): Promise<void> {
		// Broadcast interaction for now, specific logic will be added later
		this.globalEventService.publishNoctownStream('playerInteracted', {
			playerId,
			targetType,
			targetId,
		});
	}

	@bindThis
	public async broadcastEmotion(
		playerId: string,
		userId: string,
		emoji: string,
		isCustomEmoji: boolean,
	): Promise<void> {
		// Get player position for proximity-based broadcast
		const player = await this.noctownPlayersRepository.findOneBy({ id: playerId });
		if (!player) return;

		// FR-007-4: プレイヤーがオフライン状態の場合、エモーション時にオンライン化して他のプレイヤーに表示
		const wasOffline = !player.isOnline;

		if (wasOffline) {
			await this.noctownPlayersRepository.update(playerId, {
				isOnline: true,
				lastActiveAt: new Date(),
			});

			// FR-010: ユーザー情報を取得
			const user = await this.usersRepository.findOneBy({ id: userId });

			// オフラインからオンラインに変わった場合は playerJoined イベントを送信（フロントエンドと統一）
			this.globalEventService.publishNoctownStream('playerJoined', {
				id: playerId,
				playerId,
				userId,
				username: user?.username ?? '',
				name: user?.name ?? null,
				avatarUrl: user?.avatarUrl ?? null,
				positionX: player.positionX,
				positionY: player.positionY,
				positionZ: player.positionZ,
				rotation: player.rotation,
				isOnline: true,
			});
		}

		// Broadcast emotion to all connected players
		this.globalEventService.publishNoctownStream('playerEmotion', {
			playerId,
			userId,
			emoji,
			isCustomEmoji,
			positionX: player.positionX,
			positionY: player.positionY,
			positionZ: player.positionZ,
		});
	}

	// FR-029: チャットメッセージのDB保存と履歴表示
	// broadcastChat()でメッセージをDBに保存し、messageIdをイベントに含めて送信
	// FR-029: 位置情報を引数で受け取り、距離判定の精度を向上
	@bindThis
	public async broadcastChat(
		playerId: string,
		userId: string,
		message: string,
		clientPositionX: number | null = null,
		clientPositionZ: number | null = null,
	): Promise<string | null> {
		// Get player position for proximity-based broadcast
		const player = await this.noctownPlayersRepository.findOneBy({ id: playerId });
		if (!player) return null;

		// FR-029: フロントエンドから送信された位置情報を優先し、なければDBの位置を使用
		const chatPositionX = clientPositionX ?? player.positionX;
		const chatPositionZ = clientPositionZ ?? player.positionZ;

		// FR-007-4: プレイヤーがオフライン状態の場合、チャット時にオンライン化して他のプレイヤーに表示
		const wasOffline = !player.isOnline;

		if (wasOffline) {
			await this.noctownPlayersRepository.update(playerId, {
				isOnline: true,
				lastActiveAt: new Date(),
			});

			// FR-010: ユーザー情報を取得
			const user = await this.usersRepository.findOneBy({ id: userId });

			// オフラインからオンラインに変わった場合は playerJoined イベントを送信（フロントエンドと統一）
			this.globalEventService.publishNoctownStream('playerJoined', {
				id: playerId,
				playerId,
				userId,
				username: user?.username ?? '',
				name: user?.name ?? null,
				avatarUrl: user?.avatarUrl ?? null,
				positionX: chatPositionX,
				positionY: player.positionY,
				positionZ: chatPositionZ,
				rotation: player.rotation,
				isOnline: true,
			});
		}

		// FR-029: チャットメッセージをDBに保存（フロントエンドから送信された位置を使用）
		const messageId = this.idService.gen();
		await this.noctownChatLogsRepository.insert({
			id: messageId,
			playerId,
			content: message,
			positionX: chatPositionX,
			positionZ: chatPositionZ,
		});

		// FR-029: 送信者自身も中間テーブルに登録する
		// これにより、チャット履歴パネルで自分の発言も表示される
		await this.noctownChatLogRecipientsRepository.insert({
			id: this.idService.gen(),
			chatLogId: messageId,
			recipientPlayerId: playerId,
			receivedAt: new Date(),
		});

		// T143, T144: Broadcast chat to all connected players
		// FR-029: messageIdをイベントに追加（フロントエンドで距離判定後にlocalStorageに記録）
		// フロントエンドから送信された位置情報を使用
		this.globalEventService.publishNoctownStream('playerChatted', {
			playerId,
			userId,
			message,
			messageId,
			positionX: chatPositionX,
			positionY: player.positionY,
			positionZ: chatPositionZ,
		});

		return messageId;
	}

	@bindThis
	public async getPlayer(userId: MiUser['id']): Promise<NoctownPlayer | null> {
		return this.noctownPlayersRepository.findOneBy({ userId });
	}

	@bindThis
	public async getNearbyPlayers(x: number, z: number, radius: number): Promise<NoctownPlayer[]> {
		// Simple box query for nearby players
		return this.noctownPlayersRepository
			.createQueryBuilder('player')
			.where('player.isOnline = :online', { online: true })
			.andWhere('player.positionX BETWEEN :minX AND :maxX', { minX: x - radius, maxX: x + radius })
			.andWhere('player.positionZ BETWEEN :minZ AND :maxZ', { minZ: z - radius, maxZ: z + radius })
			.getMany();
	}

	@bindThis
	public async getOnlinePlayers(): Promise<NoctownPlayer[]> {
		// Get all currently online players
		return this.noctownPlayersRepository.findBy({ isOnline: true });
	}

	// FR-019: Typing indicator - broadcast when player starts typing
	@bindThis
	public broadcastTypingStart(playerId: string): void {
		this.globalEventService.publishNoctownStream('typingStart', {
			playerId,
		});
	}

	// FR-019: Typing indicator - broadcast when player stops typing
	@bindThis
	public broadcastTypingEnd(playerId: string): void {
		this.globalEventService.publishNoctownStream('typingEnd', {
			playerId,
		});
	}

	// =============================================
	// Quest System Methods
	// =============================================

	@bindThis
	public async getActiveQuests(playerId: string): Promise<Array<{
		id: string;
		questType: string;
		difficulty: number;
		status: string;
		targetItemId: string | null;
		targetCondition: Record<string, unknown> | null;
		sourceNpcId: string;
		destinationNpcId: string | null;
		rewardCoins: number;
		rewardItemId: string | null;
		startedAt: Date;
	}>> {
		const quests = await this.noctownQuestsRepository.find({
			where: { playerId, status: 'active' },
			order: { startedAt: 'DESC' },
		});

		return quests.map(q => ({
			id: q.id,
			questType: q.questType,
			difficulty: q.difficulty,
			status: q.status,
			targetItemId: q.targetItemId,
			targetCondition: q.targetCondition,
			sourceNpcId: q.sourceNpcId,
			destinationNpcId: q.destinationNpcId,
			rewardCoins: q.rewardCoins,
			rewardItemId: q.rewardItemId,
			startedAt: q.startedAt,
		}));
	}

	@bindThis
	public async startQuest(
		playerId: string,
		npcId: string,
	): Promise<{ success: boolean; questId?: string; error?: string }> {
		// Check concurrent quest limit (max 5)
		const activeCount = await this.noctownQuestsRepository.countBy({
			playerId,
			status: 'active',
		});
		if (activeCount >= 5) {
			return { success: false, error: 'MAX_QUESTS_REACHED' };
		}

		// Get NPC
		const npc = await this.noctownNpcsRepository.findOneBy({ id: npcId });
		if (!npc) {
			return { success: false, error: 'NPC_NOT_FOUND' };
		}

		// Generate quest parameters
		const questTypes = ['collect', 'deliver', 'find_name', 'find_flavor'] as const;
		const questType = questTypes[Math.floor(Math.random() * questTypes.length)];
		const difficulty = Math.floor(Math.random() * 5) + 1;

		// Generate target condition based on quest type
		let targetCondition: Record<string, unknown> | null = null;
		let targetItemId: string | null = null;
		let destinationNpcId: string | null = null;

		if (questType === 'collect') {
			// Pick a random item type to collect
			const items = await this.noctownItemsRepository.find({ take: 10 });
			if (items.length > 0) {
				const targetItem = items[Math.floor(Math.random() * items.length)];
				targetItemId = targetItem.id;
			}
		} else if (questType === 'deliver') {
			// Pick a random item to deliver and destination NPC
			const items = await this.noctownItemsRepository.find({ take: 10 });
			if (items.length > 0) {
				const targetItem = items[Math.floor(Math.random() * items.length)];
				targetItemId = targetItem.id;
			}
			// Pick a different NPC as destination
			const otherNpcs = await this.noctownNpcsRepository.find({
				where: { id: Not(npcId) },
				take: 5,
			});
			if (otherNpcs.length > 0) {
				destinationNpcId = otherNpcs[Math.floor(Math.random() * otherNpcs.length)].id;
			}
		} else if (questType === 'find_name') {
			// Generate name condition
			const prefixes = ['古代の', '輝く', '神秘の', '失われた', '伝説の'];
			targetCondition = {
				nameContains: prefixes[Math.floor(Math.random() * prefixes.length)],
			};
		} else if (questType === 'find_flavor') {
			// Generate flavor text condition
			const keywords = ['魔法', '冒険', '秘密', '力', '希望'];
			targetCondition = {
				flavorContains: keywords[Math.floor(Math.random() * keywords.length)],
			};
		}

		// Calculate reward based on difficulty and quest type
		let baseReward = difficulty * 100;
		// Quest type multipliers
		switch (questType) {
			case 'deliver':
				// Delivery quests require travel, so higher reward
				baseReward = Math.floor(baseReward * 1.5);
				break;
			case 'find_name':
			case 'find_flavor':
				// Knowledge-based quests have moderate bonus
				baseReward = Math.floor(baseReward * 1.2);
				break;
			case 'collect':
			default:
				// Standard reward for collect quests
				break;
		}
		const rewardCoins = baseReward + Math.floor(Math.random() * 50);

		// Determine reward item for high difficulty quests (difficulty 3+)
		let rewardItemId: string | null = null;
		if (difficulty >= 3 && Math.random() < 0.5) {
			// 50% chance to get item reward for high difficulty quests
			const rewardItems = await this.noctownItemsRepository.find({
				where: { rarity: difficulty <= 3 ? 1 : difficulty <= 4 ? 2 : 3 }, // R, SR, or SSR
				take: 5,
			});
			if (rewardItems.length > 0) {
				rewardItemId = rewardItems[Math.floor(Math.random() * rewardItems.length)].id;
			}
		}

		// Create quest
		const questId = this.idService.gen();
		const questData: {
			id: string;
			playerId: string;
			questType: NoctownQuestType;
			difficulty: number;
			status: NoctownQuestStatus;
			targetItemId: string | null;
			targetCondition?: Record<string, unknown>;
			sourceNpcId: string;
			destinationNpcId: string | null;
			rewardCoins: number;
			rewardItemId: string | null;
			startedAt: Date;
		} = {
			id: questId,
			playerId,
			questType,
			difficulty,
			status: 'active' as NoctownQuestStatus,
			targetItemId,
			sourceNpcId: npcId,
			destinationNpcId,
			rewardCoins,
			rewardItemId,
			startedAt: new Date(),
		};

		if (targetCondition !== null) {
			questData.targetCondition = targetCondition;
		}

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		await this.noctownQuestsRepository.insert(questData as any);

		return { success: true, questId };
	}

	@bindThis
	public async completeQuest(
		playerId: string,
		questId: string,
		submittedItemId?: string,
		npcId?: string,
	): Promise<{ success: boolean; rewardCoins?: number; rewardItemId?: string; rewardItemName?: string; error?: string }> {
		// Get quest
		const quest = await this.noctownQuestsRepository.findOneBy({
			id: questId,
			playerId,
			status: 'active',
		});
		if (!quest) {
			return { success: false, error: 'QUEST_NOT_FOUND' };
		}

		// Validate completion based on quest type
		if (quest.questType === 'deliver') {
			// Delivery quest: need to be at destination NPC with the item
			if (!quest.destinationNpcId) {
				return { success: false, error: 'QUEST_INVALID' };
			}
			if (!npcId || npcId !== quest.destinationNpcId) {
				return { success: false, error: 'WRONG_NPC' };
			}
			if (!submittedItemId) {
				return { success: false, error: 'ITEM_REQUIRED' };
			}

			// Check if player has the item
			const playerItem = await this.noctownPlayerItemsRepository.findOne({
				where: { id: submittedItemId, playerId },
				relations: ['item'],
			});
			if (!playerItem || playerItem.itemId !== quest.targetItemId) {
				return { success: false, error: 'WRONG_ITEM' };
			}

			// Consume item
			if (playerItem.quantity > 1) {
				await this.noctownPlayerItemsRepository.update(submittedItemId, {
					quantity: playerItem.quantity - 1,
				});
			} else {
				await this.noctownPlayerItemsRepository.delete(submittedItemId);
			}
		} else if (quest.questType === 'collect' && quest.targetItemId) {
			if (!submittedItemId) {
				return { success: false, error: 'ITEM_REQUIRED' };
			}

			// Check if player has the item
			const playerItem = await this.noctownPlayerItemsRepository.findOne({
				where: { id: submittedItemId, playerId },
				relations: ['item'],
			});
			if (!playerItem || playerItem.itemId !== quest.targetItemId) {
				return { success: false, error: 'WRONG_ITEM' };
			}

			// Consume item
			if (playerItem.quantity > 1) {
				await this.noctownPlayerItemsRepository.update(submittedItemId, {
					quantity: playerItem.quantity - 1,
				});
			} else {
				await this.noctownPlayerItemsRepository.delete(submittedItemId);
			}
		} else if (quest.questType === 'find_name' || quest.questType === 'find_flavor') {
			if (!submittedItemId) {
				return { success: false, error: 'ITEM_REQUIRED' };
			}

			const playerItem = await this.noctownPlayerItemsRepository.findOne({
				where: { id: submittedItemId, playerId },
				relations: ['item'],
			});
			if (!playerItem || !playerItem.item) {
				return { success: false, error: 'ITEM_NOT_FOUND' };
			}

			// Check condition
			const condition = quest.targetCondition as Record<string, string>;
			if (quest.questType === 'find_name' && condition?.nameContains) {
				if (!playerItem.item.name.includes(condition.nameContains)) {
					return { success: false, error: 'CONDITION_NOT_MET' };
				}
			} else if (quest.questType === 'find_flavor' && condition?.flavorContains) {
				if (!playerItem.item.flavorText?.includes(condition.flavorContains)) {
					return { success: false, error: 'CONDITION_NOT_MET' };
				}
			}

			// Consume item
			if (playerItem.quantity > 1) {
				await this.noctownPlayerItemsRepository.update(submittedItemId, {
					quantity: playerItem.quantity - 1,
				});
			} else {
				await this.noctownPlayerItemsRepository.delete(submittedItemId);
			}
		}

		// Mark quest as completed
		await this.noctownQuestsRepository.update(questId, {
			status: 'completed',
			completedAt: new Date(),
		});

		// Add reward coins to wallet
		const wallet = await this.noctownWalletsRepository.findOneBy({ playerId });
		if (wallet) {
			const currentBalance = BigInt(wallet.balance);
			const newBalance = currentBalance + BigInt(quest.rewardCoins);
			await this.noctownWalletsRepository.update(wallet.id, {
				balance: newBalance.toString(),
				updatedAt: new Date(),
			});
		}

		// Add reward item if specified
		let rewardItemName: string | null = null;
		if (quest.rewardItemId) {
			// Check if player already has this item
			const existingItem = await this.noctownPlayerItemsRepository.findOne({
				where: { playerId, itemId: quest.rewardItemId },
			});

			if (existingItem) {
				// Increment quantity
				await this.noctownPlayerItemsRepository.update(existingItem.id, {
					quantity: existingItem.quantity + 1,
				});
			} else {
				// Add new item to inventory
				await this.noctownPlayerItemsRepository.insert({
					id: this.idService.gen(),
					playerId,
					itemId: quest.rewardItemId,
					quantity: 1,
				});
			}

			// Get item name for response
			const rewardItem = await this.noctownItemsRepository.findOneBy({ id: quest.rewardItemId });
			if (rewardItem) {
				rewardItemName = rewardItem.name;
			}
		}

		// Update statistics
		await this.noctownPlayerStatisticsRepository.increment(
			{ playerId },
			'questsCompleted',
			1,
		);

		// Update score
		await this.noctownPlayerScoresRepository.increment(
			{ playerId },
			'questScore',
			quest.difficulty * 10,
		);

		// Broadcast quest completion
		this.globalEventService.publishNoctownStream('questCompleted', {
			playerId,
			questId,
			rewardCoins: quest.rewardCoins,
			rewardItemId: quest.rewardItemId,
			rewardItemName,
		});

		return {
			success: true,
			rewardCoins: quest.rewardCoins,
			rewardItemId: quest.rewardItemId ?? undefined,
			rewardItemName: rewardItemName ?? undefined,
		};
	}

	@bindThis
	public async abandonQuest(
		playerId: string,
		questId: string,
	): Promise<{ success: boolean; error?: string }> {
		const quest = await this.noctownQuestsRepository.findOneBy({
			id: questId,
			playerId,
			status: 'active',
		});
		if (!quest) {
			return { success: false, error: 'QUEST_NOT_FOUND' };
		}

		await this.noctownQuestsRepository.update(questId, {
			status: 'abandoned',
		});

		return { success: true };
	}

	@bindThis
	public async getNearbyNpcs(x: number, z: number, radius: number): Promise<Array<{
		id: string;
		playerId: string;
		positionX: number;
		positionY: number;
		positionZ: number;
	}>> {
		const npcs = await this.noctownNpcsRepository
			.createQueryBuilder('npc')
			.where('npc."positionX" BETWEEN :minX AND :maxX', { minX: x - radius, maxX: x + radius })
			.andWhere('npc."positionZ" BETWEEN :minZ AND :maxZ', { minZ: z - radius, maxZ: z + radius })
			.getMany();

		return npcs.map(npc => ({
			id: npc.id,
			playerId: npc.playerId,
			positionX: npc.positionX,
			positionY: npc.positionY,
			positionZ: npc.positionZ,
		}));
	}

	@bindThis
	public async createNpcFromOfflinePlayer(playerId: string): Promise<string | null> {
		// Get player position
		const player = await this.noctownPlayersRepository.findOneBy({ id: playerId });
		if (!player) return null;

		// Check if NPC already exists
		const existingNpc = await this.noctownNpcsRepository.findOneBy({ playerId });
		if (existingNpc) return existingNpc.id;

		// Create NPC
		const npcId = this.idService.gen();
		await this.noctownNpcsRepository.insert({
			id: npcId,
			playerId,
			positionX: player.positionX,
			positionY: player.positionY,
			positionZ: player.positionZ,
			createdAt: new Date(),
		});

		return npcId;
	}

	@bindThis
	public async removeNpc(playerId: string): Promise<void> {
		await this.noctownNpcsRepository.delete({ playerId });
	}

	// =============================================
	// Farming System Methods
	// =============================================

	@bindThis
	public async createFarmPlot(
		playerId: string,
		x: number,
		y: number,
		z: number,
		size: number = 1,
	): Promise<{ success: boolean; plotId?: string; error?: string }> {
		// Check farm plot limit (max 5 per player)
		const plotCount = await this.noctownFarmPlotsRepository.countBy({ playerId });
		if (plotCount >= 5) {
			return { success: false, error: 'MAX_PLOTS_REACHED' };
		}

		// Check if location is already occupied
		const existingPlot = await this.noctownFarmPlotsRepository
			.createQueryBuilder('plot')
			.where('plot."positionX" = :x AND plot."positionZ" = :z', { x, z })
			.getOne();
		if (existingPlot) {
			return { success: false, error: 'LOCATION_OCCUPIED' };
		}

		const plotId = this.idService.gen();
		await this.noctownFarmPlotsRepository.insert({
			id: plotId,
			playerId,
			positionX: x,
			positionY: y,
			positionZ: z,
			size,
			createdAt: new Date(),
		});

		this.globalEventService.publishNoctownStream('farmPlotCreated', {
			playerId,
			plotId,
			x,
			y,
			z,
			size,
		});

		return { success: true, plotId };
	}

	// T041-T042: 作物取得時に時間経過による成長状態を自動判定
	// growthTime: 作物ごとの成長時間（秒）、デフォルト300秒（5分）
	// 水レベルが50以上なら成長速度2倍
	@bindThis
	public async getPlayerFarmPlots(playerId: string): Promise<Array<{
		id: string;
		positionX: number;
		positionY: number;
		positionZ: number;
		size: number;
		crop: {
			id: string;
			stage: NoctownCropStage;
			waterLevel: number;
			growthProgress: number;
		} | null;
	}>> {
		const plots = await this.noctownFarmPlotsRepository.find({
			where: { playerId },
		});

		const result = [];
		for (const plot of plots) {
			const crop = await this.noctownCropsRepository.findOneBy({ plotId: plot.id });

			if (crop && crop.stage !== 'harvestable' && crop.stage !== 'withered') {
				// T041: 時間経過による成長判定
				await this.updateCropGrowthByTime(crop.id);
				// 更新後の作物データを再取得
				const updatedCrop = await this.noctownCropsRepository.findOneBy({ id: crop.id });
				result.push({
					id: plot.id,
					positionX: plot.positionX,
					positionY: plot.positionY,
					positionZ: plot.positionZ,
					size: plot.size,
					crop: updatedCrop ? {
						id: updatedCrop.id,
						stage: updatedCrop.stage as NoctownCropStage,
						waterLevel: updatedCrop.waterLevel,
						growthProgress: updatedCrop.growthProgress,
					} : null,
				});
			} else {
				result.push({
					id: plot.id,
					positionX: plot.positionX,
					positionY: plot.positionY,
					positionZ: plot.positionZ,
					size: plot.size,
					crop: crop ? {
						id: crop.id,
						stage: crop.stage as NoctownCropStage,
						waterLevel: crop.waterLevel,
						growthProgress: crop.growthProgress,
					} : null,
				});
			}
		}

		return result;
	}

	// T041-T042: 時間経過による成長更新
	// 植えてからの経過時間に基づいて成長進度を計算
	// DEFAULT_GROWTH_TIME_SECONDS: 完全成長までの時間（秒）
	@bindThis
	private async updateCropGrowthByTime(cropId: string): Promise<void> {
		const crop = await this.noctownCropsRepository.findOneBy({ id: cropId });
		if (!crop || crop.stage === 'harvestable' || crop.stage === 'withered') return;

		const DEFAULT_GROWTH_TIME_SECONDS = 300; // 5分で完全成長
		const now = Date.now();
		const plantedTime = new Date(crop.plantedAt).getTime();
		const elapsedSeconds = (now - plantedTime) / 1000;

		// 水レベルが50以上なら成長速度2倍
		const growthMultiplier = crop.waterLevel >= 50 ? 2 : 1;
		const effectiveElapsed = elapsedSeconds * growthMultiplier;

		// 成長進度を計算（0-100）
		const newProgress = Math.min(100, Math.floor((effectiveElapsed / DEFAULT_GROWTH_TIME_SECONDS) * 100));

		// 進度が変わっていなければ更新不要
		if (newProgress <= crop.growthProgress) return;

		// 水レベルが0になったら枯れる
		if (crop.waterLevel <= 0 && elapsedSeconds > 60) {
			await this.noctownCropsRepository.update(cropId, {
				stage: 'withered',
			});
			return;
		}

		// 時間経過で水レベルを減少（1分ごとに5減少）
		const waterDecay = Math.floor(elapsedSeconds / 60) * 5;
		const newWaterLevel = Math.max(0, crop.waterLevel - waterDecay);

		// 成長段階を判定
		let newStage: NoctownCropStage = crop.stage as NoctownCropStage;
		if (newProgress >= 100) {
			newStage = 'harvestable';
		} else if (newProgress >= 75) {
			newStage = 'mature';
		} else if (newProgress >= 50) {
			newStage = 'growing';
		} else if (newProgress >= 25) {
			newStage = 'sprout';
		}

		await this.noctownCropsRepository.update(cropId, {
			growthProgress: newProgress,
			stage: newStage,
			waterLevel: newWaterLevel,
		});
	}

	@bindThis
	public async plantCrop(
		playerId: string,
		plotId: string,
		seedItemId: string,
	): Promise<{ success: boolean; cropId?: string; error?: string }> {
		// Verify plot ownership
		const plot = await this.noctownFarmPlotsRepository.findOneBy({
			id: plotId,
			playerId,
		});
		if (!plot) {
			return { success: false, error: 'PLOT_NOT_FOUND' };
		}

		// Check if plot already has a crop
		const existingCrop = await this.noctownCropsRepository.findOneBy({ plotId });
		if (existingCrop) {
			return { success: false, error: 'PLOT_HAS_CROP' };
		}

		// Verify player has the seed item
		const playerItem = await this.noctownPlayerItemsRepository.findOne({
			where: { id: seedItemId, playerId },
			relations: ['item'],
		});
		if (!playerItem || !playerItem.item) {
			return { success: false, error: 'SEED_NOT_FOUND' };
		}

		// Consume seed
		if (playerItem.quantity > 1) {
			await this.noctownPlayerItemsRepository.update(seedItemId, {
				quantity: playerItem.quantity - 1,
			});
		} else {
			await this.noctownPlayerItemsRepository.delete(seedItemId);
		}

		// Create crop
		const cropId = this.idService.gen();
		await this.noctownCropsRepository.insert({
			id: cropId,
			plotId,
			seedItemId: playerItem.itemId,
			stage: 'seed',
			waterLevel: 50,
			growthProgress: 0,
			plantedAt: new Date(),
		});

		this.globalEventService.publishNoctownStream('cropPlanted', {
			playerId,
			plotId,
			cropId,
		});

		return { success: true, cropId };
	}

	@bindThis
	public async waterCrop(
		playerId: string,
		cropId: string,
	): Promise<{ success: boolean; waterLevel?: number; error?: string }> {
		// Get crop and verify ownership through plot
		const crop = await this.noctownCropsRepository.findOne({
			where: { id: cropId },
			relations: ['plot'],
		});
		if (!crop || !crop.plot || crop.plot.playerId !== playerId) {
			return { success: false, error: 'CROP_NOT_FOUND' };
		}

		if (crop.stage === 'withered') {
			return { success: false, error: 'CROP_WITHERED' };
		}

		// Increase water level (max 100)
		const newWaterLevel = Math.min(crop.waterLevel + 30, 100);
		await this.noctownCropsRepository.update(cropId, {
			waterLevel: newWaterLevel,
			lastWateredAt: new Date(),
		});

		// Check for growth progression
		await this.progressCropGrowth(cropId);

		return { success: true, waterLevel: newWaterLevel };
	}

	@bindThis
	public async harvestCrop(
		playerId: string,
		cropId: string,
	): Promise<{ success: boolean; itemId?: string; quantity?: number; error?: string }> {
		const crop = await this.noctownCropsRepository.findOne({
			where: { id: cropId },
			relations: ['plot'],
		});
		if (!crop || !crop.plot || crop.plot.playerId !== playerId) {
			return { success: false, error: 'CROP_NOT_FOUND' };
		}

		if (crop.stage !== 'harvestable') {
			return { success: false, error: 'CROP_NOT_READY' };
		}

		// Determine harvest yield based on growth conditions
		const harvestQuantity = Math.floor(Math.random() * 3) + 1;

		// Get corresponding harvest item (or create generic)
		const harvestItemId = crop.seedItemId; // For now, same as seed

		// Add to player inventory
		const existingItem = await this.noctownPlayerItemsRepository.findOneBy({
			playerId,
			itemId: harvestItemId,
		});

		if (existingItem) {
			await this.noctownPlayerItemsRepository.update(existingItem.id, {
				quantity: existingItem.quantity + harvestQuantity,
			});
		} else {
			await this.noctownPlayerItemsRepository.insert({
				id: this.idService.gen(),
				playerId,
				itemId: harvestItemId,
				quantity: harvestQuantity,
				acquiredAt: new Date(),
			});
		}

		// Remove crop
		await this.noctownCropsRepository.delete(cropId);

		this.globalEventService.publishNoctownStream('cropHarvested', {
			playerId,
			cropId,
			itemId: harvestItemId,
			quantity: harvestQuantity,
		});

		return { success: true, itemId: harvestItemId, quantity: harvestQuantity };
	}

	@bindThis
	private async progressCropGrowth(cropId: string): Promise<void> {
		const crop = await this.noctownCropsRepository.findOneBy({ id: cropId });
		if (!crop || crop.stage === 'harvestable' || crop.stage === 'withered') return;

		// Progress growth based on water level
		const growthIncrement = crop.waterLevel >= 50 ? 10 : 5;
		const newProgress = crop.growthProgress + growthIncrement;

		// Determine new stage based on progress
		let newStage: NoctownCropStage = crop.stage as NoctownCropStage;
		if (newProgress >= 100) {
			newStage = 'harvestable';
		} else if (newProgress >= 75) {
			newStage = 'mature';
		} else if (newProgress >= 50) {
			newStage = 'growing';
		} else if (newProgress >= 25) {
			newStage = 'sprout';
		}

		await this.noctownCropsRepository.update(cropId, {
			growthProgress: Math.min(newProgress, 100),
			stage: newStage,
		});
	}

	// =============================================
	// Livestock System Methods
	// =============================================

	/**
	 * 仕様: ニワトリ配置
	 * - spawnX, spawnZ: 配置位置をスポーン位置として保存（NPC移動の中心点）
	 * - flavorText: マルコフ連鎖で自動生成
	 * - appearance: 生成時にランダムで決定し、DBに保存（色が変わらないようにするため）
	 * 修正日: 2025-12-16
	 * 修正内容: appearanceカラムを追加（色、オンドリかどうかを保存）
	 */
	@bindThis
	public async placeChicken(
		playerId: string,
		x: number,
		y: number,
		z: number,
		name?: string,
	): Promise<{ success: boolean; chickenId?: string; error?: string }> {
		// Check chicken limit (max 5 per player)
		const chickenCount = await this.noctownChickensRepository.countBy({ playerId });
		if (chickenCount >= 5) {
			return { success: false, error: 'MAX_CHICKENS_REACHED' };
		}

		// フレーバーテキスト生成（markov-flavor-text.tsから動的インポート）
		const { generateFlavorText } = await import('./markov-flavor-text.js');
		const flavorText = generateFlavorText('chicken');

		// 外見情報を生成時に決定（ランダム）
		const chickenColors = ['white', 'brown', 'black', 'golden', 'spotted'] as const;
		const appearance = {
			color: chickenColors[Math.floor(Math.random() * chickenColors.length)],
			isRooster: Math.random() < 0.3, // 30%の確率でオンドリ
		};

		const chickenId = this.idService.gen();
		await this.noctownChickensRepository.insert({
			id: chickenId,
			playerId,
			name: name ?? null,
			positionX: x,
			positionY: y,
			positionZ: z,
			spawnX: x,
			spawnZ: z,
			flavorText,
			hunger: 100,
			happiness: 100,
			eggsReady: 0,
			appearance,
			createdAt: new Date(),
		});

		this.globalEventService.publishNoctownStream('chickenPlaced', {
			playerId,
			chickenId,
			x,
			y,
			z,
		});

		return { success: true, chickenId };
	}

	@bindThis
	public async getPlayerChickens(playerId: string): Promise<Array<{
		id: string;
		name: string | null;
		positionX: number;
		positionY: number;
		positionZ: number;
		hunger: number;
		happiness: number;
		eggsReady: number;
	}>> {
		const chickens = await this.noctownChickensRepository.find({
			where: { playerId },
		});

		return chickens.map(c => ({
			id: c.id,
			name: c.name,
			positionX: c.positionX,
			positionY: c.positionY,
			positionZ: c.positionZ,
			hunger: c.hunger,
			happiness: c.happiness,
			eggsReady: c.eggsReady,
		}));
	}

	@bindThis
	public async feedChicken(
		playerId: string,
		chickenId: string,
		feedItemId: string,
	): Promise<{ success: boolean; hunger?: number; error?: string }> {
		const chicken = await this.noctownChickensRepository.findOneBy({
			id: chickenId,
			playerId,
		});
		if (!chicken) {
			return { success: false, error: 'CHICKEN_NOT_FOUND' };
		}

		// Verify player has feed item
		const playerItem = await this.noctownPlayerItemsRepository.findOneBy({
			id: feedItemId,
			playerId,
		});
		if (!playerItem) {
			return { success: false, error: 'FEED_NOT_FOUND' };
		}

		// Consume feed
		if (playerItem.quantity > 1) {
			await this.noctownPlayerItemsRepository.update(feedItemId, {
				quantity: playerItem.quantity - 1,
			});
		} else {
			await this.noctownPlayerItemsRepository.delete(feedItemId);
		}

		// Update chicken
		const newHunger = Math.min(chicken.hunger + 30, 100);
		const newHappiness = Math.min(chicken.happiness + 10, 100);
		await this.noctownChickensRepository.update(chickenId, {
			hunger: newHunger,
			happiness: newHappiness,
			lastFedAt: new Date(),
		});

		// Check for egg production
		if (newHunger >= 70 && newHappiness >= 50) {
			await this.noctownChickensRepository.increment(
				{ id: chickenId },
				'eggsReady',
				1,
			);
		}

		return { success: true, hunger: newHunger };
	}

	@bindThis
	public async collectEggs(
		playerId: string,
		chickenId: string,
	): Promise<{ success: boolean; quantity?: number; error?: string }> {
		const chicken = await this.noctownChickensRepository.findOneBy({
			id: chickenId,
			playerId,
		});
		if (!chicken) {
			return { success: false, error: 'CHICKEN_NOT_FOUND' };
		}

		if (chicken.eggsReady <= 0) {
			return { success: false, error: 'NO_EGGS_READY' };
		}

		const eggsCollected = chicken.eggsReady;

		// Reset eggs
		await this.noctownChickensRepository.update(chickenId, {
			eggsReady: 0,
			lastEggCollectedAt: new Date(),
		});

		// Add eggs to inventory (need to have an egg item or create one)
		// For now, just broadcast the event
		this.globalEventService.publishNoctownStream('eggsCollected', {
			playerId,
			chickenId,
			quantity: eggsCollected,
		});

		return { success: true, quantity: eggsCollected };
	}

	/**
	 * 仕様: ウシ配置
	 * - spawnX, spawnZ: 配置位置をスポーン位置として保存（NPC移動の中心点）
	 * - flavorText: マルコフ連鎖で自動生成
	 * - appearance: 生成時にランダムで決定し、DBに保存（色が変わらないようにするため）
	 * 修正日: 2025-12-16
	 * 修正内容: appearanceカラムを追加（色を保存）
	 */
	@bindThis
	public async placeCow(
		playerId: string,
		x: number,
		y: number,
		z: number,
		name?: string,
	): Promise<{ success: boolean; cowId?: string; error?: string }> {
		// Check cow limit (max 3 per player)
		const cowCount = await this.noctownCowsRepository.countBy({ playerId });
		if (cowCount >= 3) {
			return { success: false, error: 'MAX_COWS_REACHED' };
		}

		// フレーバーテキスト生成（markov-flavor-text.tsから動的インポート）
		const { generateFlavorText } = await import('./markov-flavor-text.js');
		const flavorText = generateFlavorText('cow');

		// 外見情報を生成時に決定（ランダム）
		const cowColors = ['holsteinBW', 'holsteinRW', 'jersey', 'angus', 'highland'] as const;
		const appearance = {
			color: cowColors[Math.floor(Math.random() * cowColors.length)],
		};

		const cowId = this.idService.gen();
		await this.noctownCowsRepository.insert({
			id: cowId,
			playerId,
			name: name ?? null,
			positionX: x,
			positionY: y,
			positionZ: z,
			spawnX: x,
			spawnZ: z,
			flavorText,
			hunger: 100,
			happiness: 100,
			milkReady: 0,
			appearance,
			createdAt: new Date(),
		});

		this.globalEventService.publishNoctownStream('cowPlaced', {
			playerId,
			cowId,
			x,
			y,
			z,
		});

		return { success: true, cowId };
	}

	@bindThis
	public async getPlayerCows(playerId: string): Promise<Array<{
		id: string;
		name: string | null;
		positionX: number;
		positionY: number;
		positionZ: number;
		hunger: number;
		happiness: number;
		milkReady: number;
	}>> {
		const cows = await this.noctownCowsRepository.find({
			where: { playerId },
		});

		return cows.map(c => ({
			id: c.id,
			name: c.name,
			positionX: c.positionX,
			positionY: c.positionY,
			positionZ: c.positionZ,
			hunger: c.hunger,
			happiness: c.happiness,
			milkReady: c.milkReady,
		}));
	}

	@bindThis
	public async feedCow(
		playerId: string,
		cowId: string,
		feedItemId: string,
	): Promise<{ success: boolean; hunger?: number; error?: string }> {
		const cow = await this.noctownCowsRepository.findOneBy({
			id: cowId,
			playerId,
		});
		if (!cow) {
			return { success: false, error: 'COW_NOT_FOUND' };
		}

		// Verify player has feed item
		const playerItem = await this.noctownPlayerItemsRepository.findOneBy({
			id: feedItemId,
			playerId,
		});
		if (!playerItem) {
			return { success: false, error: 'FEED_NOT_FOUND' };
		}

		// Consume feed
		if (playerItem.quantity > 1) {
			await this.noctownPlayerItemsRepository.update(feedItemId, {
				quantity: playerItem.quantity - 1,
			});
		} else {
			await this.noctownPlayerItemsRepository.delete(feedItemId);
		}

		// Update cow
		const newHunger = Math.min(cow.hunger + 25, 100);
		const newHappiness = Math.min(cow.happiness + 10, 100);
		await this.noctownCowsRepository.update(cowId, {
			hunger: newHunger,
			happiness: newHappiness,
			lastFedAt: new Date(),
		});

		// Check for milk production
		if (newHunger >= 70 && newHappiness >= 50) {
			await this.noctownCowsRepository.increment(
				{ id: cowId },
				'milkReady',
				1,
			);
		}

		return { success: true, hunger: newHunger };
	}

	@bindThis
	public async collectMilk(
		playerId: string,
		cowId: string,
	): Promise<{ success: boolean; quantity?: number; error?: string }> {
		const cow = await this.noctownCowsRepository.findOneBy({
			id: cowId,
			playerId,
		});
		if (!cow) {
			return { success: false, error: 'COW_NOT_FOUND' };
		}

		if (cow.milkReady <= 0) {
			return { success: false, error: 'NO_MILK_READY' };
		}

		const milkCollected = cow.milkReady;

		// Reset milk
		await this.noctownCowsRepository.update(cowId, {
			milkReady: 0,
			lastMilkCollectedAt: new Date(),
		});

		// Broadcast event
		this.globalEventService.publishNoctownStream('milkCollected', {
			playerId,
			cowId,
			quantity: milkCollected,
		});

		return { success: true, quantity: milkCollected };
	}

	// =============================================
	// House System Methods
	// =============================================

	@bindThis
	public async placeHouse(
		playerId: string,
		playerItemId: string,
		x: number,
		y: number,
		z: number,
		rotation: number,
		name?: string,
	): Promise<{ success: boolean; houseId?: string; error?: string }> {
		// Check house limit (max 1 per player for now)
		const houseCount = await this.noctownHousesRepository.countBy({ ownerId: playerId });
		if (houseCount >= 1) {
			return { success: false, error: 'MAX_HOUSES_REACHED' };
		}

		// Verify player has the house item
		const playerItem = await this.noctownPlayerItemsRepository.findOne({
			where: { id: playerItemId, playerId },
			relations: ['item'],
		});
		if (!playerItem || !playerItem.item) {
			return { success: false, error: 'HOUSE_ITEM_NOT_FOUND' };
		}

		// Check if item is a house type
		if (playerItem.item.itemType !== 'house') {
			return { success: false, error: 'INVALID_HOUSE_ITEM' };
		}

		// Check for collision with existing houses (10 unit radius)
		const nearbyHouses = await this.noctownHousesRepository
			.createQueryBuilder('house')
			.where('house."positionX" BETWEEN :minX AND :maxX', { minX: x - 10, maxX: x + 10 })
			.andWhere('house."positionZ" BETWEEN :minZ AND :maxZ', { minZ: z - 10, maxZ: z + 10 })
			.getCount();

		if (nearbyHouses > 0) {
			return { success: false, error: 'LOCATION_OCCUPIED' };
		}

		// Consume house item from inventory
		if (playerItem.quantity > 1) {
			await this.noctownPlayerItemsRepository.update(playerItemId, {
				quantity: playerItem.quantity - 1,
			});
		} else {
			await this.noctownPlayerItemsRepository.delete(playerItemId);
		}

		// Create house
		const houseId = this.idService.gen();
		await this.noctownHousesRepository.insert({
			id: houseId,
			ownerId: playerId,
			name: name ?? null,
			positionX: x,
			positionY: y,
			positionZ: z,
			rotation,
			houseType: 1, // Default house type
			createdAt: new Date(),
		});

		// Broadcast house placement
		this.globalEventService.publishNoctownStream('housePlaced', {
			playerId,
			houseId,
			x,
			y,
			z,
			rotation,
		});

		return { success: true, houseId };
	}

	@bindThis
	public async getPlayerHouse(playerId: string): Promise<{
		id: string;
		name: string | null;
		positionX: number;
		positionY: number;
		positionZ: number;
		rotation: number;
		houseType: number;
	} | null> {
		const house = await this.noctownHousesRepository.findOneBy({ ownerId: playerId });
		if (!house) return null;

		return {
			id: house.id,
			name: house.name,
			positionX: house.positionX,
			positionY: house.positionY,
			positionZ: house.positionZ,
			rotation: house.rotation,
			houseType: house.houseType,
		};
	}

	@bindThis
	public async getHouseAt(x: number, z: number, radius: number = 5): Promise<{
		id: string;
		ownerId: string;
		name: string | null;
		positionX: number;
		positionY: number;
		positionZ: number;
		rotation: number;
		houseType: number;
	} | null> {
		const house = await this.noctownHousesRepository
			.createQueryBuilder('house')
			.where('house."positionX" BETWEEN :minX AND :maxX', { minX: x - radius, maxX: x + radius })
			.andWhere('house."positionZ" BETWEEN :minZ AND :maxZ', { minZ: z - radius, maxZ: z + radius })
			.getOne();

		if (!house) return null;

		return {
			id: house.id,
			ownerId: house.ownerId,
			name: house.name,
			positionX: house.positionX,
			positionY: house.positionY,
			positionZ: house.positionZ,
			rotation: house.rotation,
			houseType: house.houseType,
		};
	}

	@bindThis
	public async getNearbyHouses(x: number, z: number, radius: number): Promise<Array<{
		id: string;
		ownerId: string;
		name: string | null;
		positionX: number;
		positionY: number;
		positionZ: number;
		rotation: number;
		houseType: number;
	}>> {
		const houses = await this.noctownHousesRepository
			.createQueryBuilder('house')
			.where('house."positionX" BETWEEN :minX AND :maxX', { minX: x - radius, maxX: x + radius })
			.andWhere('house."positionZ" BETWEEN :minZ AND :maxZ', { minZ: z - radius, maxZ: z + radius })
			.getMany();

		return houses.map(h => ({
			id: h.id,
			ownerId: h.ownerId,
			name: h.name,
			positionX: h.positionX,
			positionY: h.positionY,
			positionZ: h.positionZ,
			rotation: h.rotation,
			houseType: h.houseType,
		}));
	}

	@bindThis
	public async updateHouseName(
		playerId: string,
		houseId: string,
		name: string,
	): Promise<{ success: boolean; error?: string }> {
		const house = await this.noctownHousesRepository.findOneBy({
			id: houseId,
			ownerId: playerId,
		});
		if (!house) {
			return { success: false, error: 'HOUSE_NOT_FOUND' };
		}

		await this.noctownHousesRepository.update(houseId, { name });

		return { success: true };
	}

	@bindThis
	public async removeHouse(
		playerId: string,
		houseId: string,
	): Promise<{ success: boolean; error?: string }> {
		const house = await this.noctownHousesRepository.findOneBy({
			id: houseId,
			ownerId: playerId,
		});
		if (!house) {
			return { success: false, error: 'HOUSE_NOT_FOUND' };
		}

		// Delete house
		await this.noctownHousesRepository.delete(houseId);

		// Broadcast house removal
		this.globalEventService.publishNoctownStream('houseRemoved', {
			playerId,
			houseId,
		});

		return { success: true };
	}

	// FR-014: Ping/Pongオフライン検出 - 対象プレイヤーにpingを送信
	@bindThis
	public sendPlayerPing(senderPlayerId: string, targetPlayerId: string, pingId: string): void {
		// 対象プレイヤーのストリームにpingを送信
		this.globalEventService.publishNoctownPlayerStream(targetPlayerId, 'playerPingReceived', {
			senderPlayerId,
			pingId,
		});
	}

	// FR-014: Ping/Pongオフライン検出 - ping送信元にpongを返送
	@bindThis
	public sendPlayerPong(responderPlayerId: string, senderPlayerId: string, pingId: string): void {
		// ping送信元のストリームにpongを返送
		this.globalEventService.publishNoctownPlayerStream(senderPlayerId, 'playerPongReceived', {
			responderPlayerId,
			pingId,
		});
	}

	/**
	 * Fix player Y position if out of valid range (T014)
	 * Auto-correct Y position to ground level if too low or too high
	 */
	@bindThis
	public async fixPlayerYPosition(playerId: string): Promise<void> {
		const player = await this.noctownPlayersRepository.findOneBy({ id: playerId });
		if (!player) return;

		// Y position validation: should be between -10 and 100
		// If out of range, reset to ground level (0)
		if (player.positionY < -10 || player.positionY > 100) {
			await this.noctownPlayersRepository.update(
				{ id: playerId },
				{ positionY: 0 },
			);
		}
	}

	/**
	 * Find players that should transition to offline status
	 * @param timeoutSeconds Timeout in seconds (default: 30)
	 */
	@bindThis
	public async findPlayersForOfflineTransition(timeoutSeconds: number = 30): Promise<NoctownPlayer[]> {
		const threshold = new Date(Date.now() - timeoutSeconds * 1000);
		return this.noctownPlayersRepository.find({
			where: {
				isOnline: true,
				lastActiveAt: LessThan(threshold),
			},
		});
	}

	/**
	 * Set player offline status and broadcast full PlayerData
	 */
	@bindThis
	// FR-007-6: オフライン時は画面からプレイヤーを削除
	public async setPlayerOfflineAndBroadcast(playerId: string): Promise<void> {
		// Update database
		await this.noctownPlayersRepository.update(
			{ id: playerId },
			{ isOnline: false },
		);

		// FR-007-6: playerIdのみを送信してフロントエンドで削除させる（イベント名をplayerLeftに統一）
		this.globalEventService.publishNoctownStream('playerLeft', {
			playerId,
		});
	}

	/**
	 * Set player offline status (legacy method, kept for compatibility)
	 */
	@bindThis
	public async setPlayerOffline(playerId: string): Promise<void> {
		await this.noctownPlayersRepository.update(
			{ id: playerId },
			{ isOnline: false },
		);
	}

	/**
	 * Background job: Transition inactive players to offline status
	 * Should be called every 1 minute
	 */
	@bindThis
	public async processOfflineTransitions(): Promise<void> {
		const players = await this.findPlayersForOfflineTransition(30);

		for (const player of players) {
			await this.setPlayerOfflineAndBroadcast(player.id);
		}
	}

	/**
	 * Update player's last active timestamp
	 */
	@bindThis
	public async updatePlayerLastActive(playerId: string): Promise<void> {
		await this.noctownPlayersRepository.update(
			{ id: playerId },
			{ lastActiveAt: new Date() },
		);
	}

	/**
	 * Find multiple chunks by coordinates (T005)
	 */
	@bindThis
	public async findChunks(
		worldId: string,
		chunks: { chunkX: number; chunkZ: number }[],
	) {
		if (chunks.length === 0) return [];

		const query = this.noctownWorldChunksRepository.createQueryBuilder('chunk')
			.where('chunk.worldId = :worldId', { worldId });

		// Build OR condition for each chunk coordinate pair
		const orConditions = chunks.map((_, i) => `(chunk.chunkX = :x${i} AND chunk.chunkZ = :z${i})`).join(' OR ');
		query.andWhere(`(${orConditions})`);

		// Add parameters
		const params: Record<string, number> = {};
		chunks.forEach((chunk, i) => {
			params[`x${i}`] = chunk.chunkX;
			params[`z${i}`] = chunk.chunkZ;
		});
		query.setParameters(params);

		return query.getMany();
	}

	/**
	 * Check if a chunk exists (T006)
	 */
	@bindThis
	public async chunkExists(worldId: string, chunkX: number, chunkZ: number): Promise<boolean> {
		const count = await this.noctownWorldChunksRepository.count({
			where: { worldId, chunkX, chunkZ },
		});
		return count > 0;
	}

	/**
	 * Seeded random number generator
	 */
	private seededRandom(seed: number): number {
		return Math.abs(Math.sin(seed) * 10000) % 1;
	}

	/**
	 * Hash coordinates to generate a deterministic seed
	 */
	private hashCoordinates(worldId: string, chunkX: number, chunkZ: number): number {
		// Simple hash function
		let hash = 0;
		for (let i = 0; i < worldId.length; i++) {
			hash = ((hash << 5) - hash) + worldId.charCodeAt(i);
			hash = hash & hash;
		}
		return hash + chunkX * 1000 + chunkZ;
	}

	/**
	 * Generate a new chunk (T032-T033-T034)
	 * Returns null if chunk already exists (T034)
	 */
	@bindThis
	public async generateChunk(worldId: string, chunkX: number, chunkZ: number) {
		console.log('[NoctownService] generateChunk: start', { worldId, chunkX, chunkZ });

		// T034: Check if chunk already exists (UNIQUE constraint handling)
		const existingChunk = await this.noctownWorldChunksRepository.findOneBy({
			worldId,
			chunkX,
			chunkZ,
		});

		console.log('[NoctownService] generateChunk: existing check', {
			worldId,
			chunkX,
			chunkZ,
			exists: !!existingChunk,
			hasEnvironmentObjects: existingChunk ? !!existingChunk.environmentObjects : false,
		});

		if (existingChunk) {
			// FR-010: チャンクにenvironmentObjectsがない場合は、決定論的に再生成して保存
			if (!existingChunk.environmentObjects || (Array.isArray(existingChunk.environmentObjects) && (existingChunk.environmentObjects as any[]).length === 0)) {
				console.log('[NoctownService] generateChunk: regenerating environment objects for existing chunk', { worldId, chunkX, chunkZ });
				const generator = getChunkGenerator(12345);
				const chunkTerrainData = generator.generateChunk(chunkX, chunkZ);

				const environmentObjects = chunkTerrainData.environmentObjects.map(obj => ({
					type: obj.type,
					localX: obj.localX,
					localZ: obj.localZ,
					variant: obj.variant,
					scale: obj.scale,
				}));

				(existingChunk as any).environmentObjects = environmentObjects;
				await this.noctownWorldChunksRepository.save(existingChunk);
				console.log('[NoctownService] generateChunk: saved environment objects', { worldId, chunkX, chunkZ, count: environmentObjects.length });
			}

			// Chunk already exists - return existing chunk data
			console.log('[NoctownService] generateChunk: returning existing chunk', { worldId, chunkX, chunkZ });
			return existingChunk;
		}

		// T032: Generate chunk using Perlin noise
		console.log('[NoctownService] generateChunk: generating new chunk', { worldId, chunkX, chunkZ });
		const generator = getChunkGenerator(12345); // Use consistent seed for deterministic generation
		const chunkTerrainData = generator.generateChunk(chunkX, chunkZ);

		console.log('[NoctownService] generateChunk: chunk generated from generator', {
			worldId,
			chunkX,
			chunkZ,
			biome: chunkTerrainData.biome,
			hasTerrainData: !!chunkTerrainData.terrainData,
			environmentObjectsCount: chunkTerrainData.environmentObjects.length,
		});

		// FR-001: chunk-generator.tsのterrainDataを1次元配列に変換（16×16 = 256要素）
		const terrainData = new Array(256);
		for (let i = 0; i < 256; i++) {
			const localX = i % 16;
			const localZ = Math.floor(i / 16);
			terrainData[i] = chunkTerrainData.terrainData[localX][localZ];
		}

		// FR-010: environmentObjectsをデータベースに保存用に整形
		const environmentObjects = chunkTerrainData.environmentObjects.map(obj => ({
			type: obj.type,
			localX: obj.localX,
			localZ: obj.localZ,
			variant: obj.variant,
			scale: obj.scale,
		}));

		// T033: Save generated chunk to database
		const chunkId = this.idService.gen();
		const newChunk = this.noctownWorldChunksRepository.create({
			id: chunkId,
			worldId,
			chunkX,
			chunkZ,
			biome: chunkTerrainData.biome,
			generatedAt: new Date(),
		});
		// FR-001: terrainDataをデータベースに保存（チャンク生成器から取得したデータ）
		(newChunk as any).terrainData = terrainData;
		// FR-010: environmentObjectsをデータベースに保存
		(newChunk as any).environmentObjects = environmentObjects;

		console.log('[NoctownService] generateChunk: saving to database', { worldId, chunkX, chunkZ, chunkId });
		const chunk = await this.noctownWorldChunksRepository.save(newChunk);
		console.log('[NoctownService] generateChunk: saved successfully', {
			worldId,
			chunkX,
			chunkZ,
			chunkId: chunk.id,
			hasTerrainData: !!(chunk as any).terrainData,
			hasEnvironmentObjects: !!(chunk as any).environmentObjects,
		});

		return chunk;
	}

	// =============================================
	// Pet Map Display System Methods (User Story 14)
	// =============================================

	/**
	 * PetInfo型定義（フロントエンドと共有）
	 * appearance: 外見情報（色など）を含む
	 * 修正日: 2025-12-16
	 */
	private toCowPetInfo(cow: any, player?: any, user?: any): {
		id: string;
		type: 'cow';
		name: string | null;
		positionX: number;
		positionY: number;
		positionZ: number;
		spawnX: number;
		spawnZ: number;
		ownerId: string;
		ownerName: string;
		ownerUsername: string;
		ownerAvatarUrl: string | null;
		flavorText: string;
		hunger: number;
		happiness: number;
		milkReady: number;
		createdAt: Date;
		appearance: { color: 'holsteinBW' | 'holsteinRW' | 'jersey' | 'angus' | 'highland' };
	} {
		const p = player || cow.player;
		const u = user || p?.user;
		// appearanceが未設定の場合はデフォルト値（白黒ホルスタイン）を使用
		const appearance = cow.appearance ?? { color: 'holsteinBW' };
		return {
			id: cow.id,
			type: 'cow' as const,
			name: cow.name,
			positionX: cow.positionX,
			positionY: cow.positionY,
			positionZ: cow.positionZ,
			spawnX: cow.spawnX,
			spawnZ: cow.spawnZ,
			ownerId: cow.playerId,
			ownerName: u?.name ?? '',
			ownerUsername: u?.username ?? '',
			ownerAvatarUrl: u?.avatarUrl ?? null,
			flavorText: cow.flavorText,
			hunger: cow.hunger,
			happiness: cow.happiness,
			milkReady: cow.milkReady,
			createdAt: cow.createdAt,
			appearance,
		};
	}

	/**
	 * ChickenPetInfo変換
	 * appearance: 外見情報（色、オンドリかどうか）を含む
	 * 修正日: 2025-12-16
	 */
	private toChickenPetInfo(chicken: any, player?: any, user?: any): {
		id: string;
		type: 'chicken';
		name: string | null;
		positionX: number;
		positionY: number;
		positionZ: number;
		spawnX: number;
		spawnZ: number;
		ownerId: string;
		ownerName: string;
		ownerUsername: string;
		ownerAvatarUrl: string | null;
		flavorText: string;
		hunger: number;
		happiness: number;
		eggsReady: number;
		createdAt: Date;
		appearance: { color: 'white' | 'brown' | 'black' | 'golden' | 'spotted'; isRooster: boolean };
	} {
		const p = player || chicken.player;
		const u = user || p?.user;
		// appearanceが未設定の場合はデフォルト値（白）を使用
		const appearance = chicken.appearance ?? { color: 'white', isRooster: false };
		return {
			id: chicken.id,
			type: 'chicken' as const,
			name: chicken.name,
			positionX: chicken.positionX,
			positionY: chicken.positionY,
			positionZ: chicken.positionZ,
			spawnX: chicken.spawnX,
			spawnZ: chicken.spawnZ,
			ownerId: chicken.playerId,
			ownerName: u?.name ?? '',
			ownerUsername: u?.username ?? '',
			ownerAvatarUrl: u?.avatarUrl ?? null,
			flavorText: chicken.flavorText,
			hunger: chicken.hunger,
			happiness: chicken.happiness,
			eggsReady: chicken.eggsReady,
			createdAt: chicken.createdAt,
			appearance,
		};
	}

	/**
	 * プレイヤーのペット総数を取得（上限チェック用）
	 */
	@bindThis
	public async getPetCount(playerId: string): Promise<number> {
		const cowCount = await this.noctownCowsRepository.countBy({ playerId });
		const chickenCount = await this.noctownChickensRepository.countBy({ playerId });
		return cowCount + chickenCount;
	}

	/**
	 * ペット作成（FR-022, FR-024）
	 * マルコフ連鎖でフレーバーテキストを生成し、ペットを作成する
	 * appearance: 生成時にランダムで決定し、DBに保存（色が変わらないようにするため）
	 * 修正日: 2025-12-16
	 */
	@bindThis
	public async createPet(
		playerId: string,
		type: 'cow' | 'chicken',
		name: string | null,
		positionX: number,
		positionZ: number,
	): Promise<{ success: boolean; pet?: any; error?: string }> {
		// 上限チェック（10匹まで）
		const petCount = await this.getPetCount(playerId);
		if (petCount >= 10) {
			return { success: false, error: 'PET_LIMIT_EXCEEDED' };
		}

		// フレーバーテキスト生成（markov-flavor-text.tsから動的インポート）
		const { generateFlavorText } = await import('./markov-flavor-text.js');
		const flavorText = generateFlavorText(type);

		const positionY = 0; // 地面レベル
		const player = await this.noctownPlayersRepository.findOneBy({ id: playerId });
		const user = player ? await this.usersRepository.findOneBy({ id: player.userId }) : null;

		if (type === 'cow') {
			// 外見情報を生成時に決定（ランダム）
			const cowColors = ['holsteinBW', 'holsteinRW', 'jersey', 'angus', 'highland'] as const;
			const appearance = {
				color: cowColors[Math.floor(Math.random() * cowColors.length)],
			};

			const cowId = this.idService.gen();
			await this.noctownCowsRepository.insert({
				id: cowId,
				playerId,
				name: name ?? null,
				positionX,
				positionY,
				positionZ,
				spawnX: positionX,
				spawnZ: positionZ,
				flavorText,
				hunger: 100,
				happiness: 100,
				milkReady: 0,
				appearance,
				createdAt: new Date(),
			});

			const cow = await this.noctownCowsRepository.findOneBy({ id: cowId });
			if (!cow) {
				return { success: false, error: 'CREATE_FAILED' };
			}

			const petInfo = this.toCowPetInfo(cow, player, user);

			// ペット作成イベントをブロードキャスト
			this.globalEventService.publishNoctownStream('petCreated', {
				playerId,
				pet: petInfo,
			});

			return { success: true, pet: petInfo };
		} else {
			// 外見情報を生成時に決定（ランダム）
			const chickenColors = ['white', 'brown', 'black', 'golden', 'spotted'] as const;
			const appearance = {
				color: chickenColors[Math.floor(Math.random() * chickenColors.length)],
				isRooster: Math.random() < 0.3, // 30%の確率でオンドリ
			};

			const chickenId = this.idService.gen();
			await this.noctownChickensRepository.insert({
				id: chickenId,
				playerId,
				name: name ?? null,
				positionX,
				positionY,
				positionZ,
				spawnX: positionX,
				spawnZ: positionZ,
				flavorText,
				hunger: 100,
				happiness: 100,
				eggsReady: 0,
				appearance,
				createdAt: new Date(),
			});

			const chicken = await this.noctownChickensRepository.findOneBy({ id: chickenId });
			if (!chicken) {
				return { success: false, error: 'CREATE_FAILED' };
			}

			const petInfo = this.toChickenPetInfo(chicken, player, user);

			// ペット作成イベントをブロードキャスト
			this.globalEventService.publishNoctownStream('petCreated', {
				playerId,
				pet: petInfo,
			});

			return { success: true, pet: petInfo };
		}
	}

	/**
	 * プレイヤーのペット一覧取得
	 */
	@bindThis
	public async getMyPets(playerId: string): Promise<any[]> {
		const player = await this.noctownPlayersRepository.findOneBy({ id: playerId });
		const user = player ? await this.usersRepository.findOneBy({ id: player.userId }) : null;

		const cows = await this.noctownCowsRepository.findBy({ playerId });
		const chickens = await this.noctownChickensRepository.findBy({ playerId });

		const cowInfos = cows.map(cow => this.toCowPetInfo(cow, player, user));
		const chickenInfos = chickens.map(chicken => this.toChickenPetInfo(chicken, player, user));

		return [...cowInfos, ...chickenInfos];
	}

	/**
	 * 近隣ペット取得（FR-022）
	 * 指定座標から半径内のペットを取得
	 */
	@bindThis
	public async getNearbyPets(centerX: number, centerZ: number, radius: number = 20): Promise<any[]> {
		// 牛を取得
		const cows = await this.noctownCowsRepository
			.createQueryBuilder('cow')
			.leftJoinAndSelect('cow.player', 'player')
			.where('cow."positionX" BETWEEN :minX AND :maxX', { minX: centerX - radius, maxX: centerX + radius })
			.andWhere('cow."positionZ" BETWEEN :minZ AND :maxZ', { minZ: centerZ - radius, maxZ: centerZ + radius })
			.getMany();

		// 鶏を取得
		const chickens = await this.noctownChickensRepository
			.createQueryBuilder('chicken')
			.leftJoinAndSelect('chicken.player', 'player')
			.where('chicken."positionX" BETWEEN :minX AND :maxX', { minX: centerX - radius, maxX: centerX + radius })
			.andWhere('chicken."positionZ" BETWEEN :minZ AND :maxZ', { minZ: centerZ - radius, maxZ: centerZ + radius })
			.getMany();

		const results: any[] = [];

		// 牛のPetInfoを生成
		for (const cow of cows) {
			const player = cow.player;
			const user = player ? await this.usersRepository.findOneBy({ id: player.userId }) : null;
			results.push(this.toCowPetInfo(cow, player, user));
		}

		// 鶏のPetInfoを生成
		for (const chicken of chickens) {
			const player = chicken.player;
			const user = player ? await this.usersRepository.findOneBy({ id: player.userId }) : null;
			results.push(this.toChickenPetInfo(chicken, player, user));
		}

		return results;
	}

	/**
	 * ペット取得（ID指定）
	 */
	@bindThis
	public async getPetById(petId: string): Promise<any | null> {
		// 牛を検索
		const cow = await this.noctownCowsRepository
			.createQueryBuilder('cow')
			.leftJoinAndSelect('cow.player', 'player')
			.where('cow.id = :id', { id: petId })
			.getOne();

		if (cow) {
			const player = cow.player;
			const user = player ? await this.usersRepository.findOneBy({ id: player.userId }) : null;
			return this.toCowPetInfo(cow, player, user);
		}

		// 鶏を検索
		const chicken = await this.noctownChickensRepository
			.createQueryBuilder('chicken')
			.leftJoinAndSelect('chicken.player', 'player')
			.where('chicken.id = :id', { id: petId })
			.getOne();

		if (chicken) {
			const player = chicken.player;
			const user = player ? await this.usersRepository.findOneBy({ id: player.userId }) : null;
			return this.toChickenPetInfo(chicken, player, user);
		}

		return null;
	}

	/**
	 * ペット削除
	 */
	@bindThis
	public async deletePet(playerId: string, petId: string): Promise<{ success: boolean; error?: string }> {
		// 牛を検索
		const cow = await this.noctownCowsRepository.findOneBy({ id: petId, playerId });
		if (cow) {
			await this.noctownCowsRepository.delete(petId);

			this.globalEventService.publishNoctownStream('petDeleted', {
				playerId,
				petId,
			});

			return { success: true };
		}

		// 鶏を検索
		const chicken = await this.noctownChickensRepository.findOneBy({ id: petId, playerId });
		if (chicken) {
			await this.noctownChickensRepository.delete(petId);

			this.globalEventService.publishNoctownStream('petDeleted', {
				playerId,
				petId,
			});

			return { success: true };
		}

		return { success: false, error: 'NOT_FOUND' };
	}

	/**
	 * ペット名変更
	 */
	@bindThis
	public async renamePet(playerId: string, petId: string, name: string | null): Promise<{ success: boolean; pet?: any; error?: string }> {
		// 牛を検索
		const cow = await this.noctownCowsRepository.findOneBy({ id: petId, playerId });
		if (cow) {
			await this.noctownCowsRepository.update(petId, { name });
			const updatedCow = await this.noctownCowsRepository.findOneBy({ id: petId });
			if (!updatedCow) {
				return { success: false, error: 'UPDATE_FAILED' };
			}
			const player = await this.noctownPlayersRepository.findOneBy({ id: playerId });
			const user = player ? await this.usersRepository.findOneBy({ id: player.userId }) : null;
			return { success: true, pet: this.toCowPetInfo(updatedCow, player, user) };
		}

		// 鶏を検索
		const chicken = await this.noctownChickensRepository.findOneBy({ id: petId, playerId });
		if (chicken) {
			await this.noctownChickensRepository.update(petId, { name });
			const updatedChicken = await this.noctownChickensRepository.findOneBy({ id: petId });
			if (!updatedChicken) {
				return { success: false, error: 'UPDATE_FAILED' };
			}
			const player = await this.noctownPlayersRepository.findOneBy({ id: playerId });
			const user = player ? await this.usersRepository.findOneBy({ id: player.userId }) : null;
			return { success: true, pet: this.toChickenPetInfo(updatedChicken, player, user) };
		}

		return { success: false, error: 'NOT_FOUND' };
	}
}
