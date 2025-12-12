/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Not } from 'typeorm';
import { DI } from '@/di-symbols.js';
import { bindThis } from '@/decorators.js';
import { IdService } from '@/core/IdService.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
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
} from '@/models/_.js';
import type { NoctownCropStage } from '@/models/noctown/NoctownCrop.js';
import type { NoctownQuestType, NoctownQuestStatus } from '@/models/noctown/NoctownQuest.js';
import type { NoctownPlayer } from '@/models/noctown/NoctownPlayer.js';
import type { MiUser } from '@/models/User.js';

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

		private idService: IdService,
		private globalEventService: GlobalEventService,
	) {}

	@bindThis
	public async createPlayer(userId: MiUser['id']): Promise<NoctownPlayer> {
		const playerId = this.idService.gen();

		// Create player record
		const player = await this.noctownPlayersRepository.insertOne({
			id: playerId,
			userId,
			positionX: 0,
			positionY: 0,
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

		this.globalEventService.publishNoctownStream('playerOnline', {
			playerId,
			userId,
		});
	}

	@bindThis
	public async setPlayerOffline(playerId: string, userId: string): Promise<void> {
		await this.noctownPlayersRepository.update(playerId, {
			isOnline: false,
		});

		this.globalEventService.publishNoctownStream('playerOffline', {
			playerId,
			userId,
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
		await this.noctownPlayersRepository.update(playerId, {
			positionX: x,
			positionY: y,
			positionZ: z,
			...(rotation != null ? { rotation } : {}),
			lastActiveAt: new Date(),
		});

		this.globalEventService.publishNoctownStream('playerMoved', {
			playerId,
			userId,
			x,
			y,
			z,
			rotation: rotation ?? 0,
		});
	}

	@bindThis
	public async pickUpItem(playerId: string, droppedItemId: string): Promise<boolean> {
		// Find the dropped item
		const droppedItem = await this.noctownDroppedItemsRepository.findOneBy({ id: droppedItemId });
		if (!droppedItem) return false;

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
			// Increment quantity
			await this.noctownPlayerItemsRepository.update(existingPlayerItem.id, {
				quantity: existingPlayerItem.quantity + 1,
			});
		} else {
			// Add new item to inventory
			await this.noctownPlayerItemsRepository.insert({
				id: this.idService.gen(),
				playerId,
				itemId: droppedItem.itemId,
				quantity: 1,
				acquiredAt: new Date(),
			});
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
	}

	@bindThis
	public async placeItem(
		playerId: string,
		playerItemId: string,
		x: number,
		y: number,
		z: number,
		rotation: number,
	): Promise<boolean> {
		// Find the player item
		const playerItem = await this.noctownPlayerItemsRepository.findOne({
			where: { id: playerItemId, playerId },
			relations: ['item'],
		});
		if (!playerItem || !playerItem.item) return false;

		// Check if item is placeable
		if (playerItem.item.itemType !== 'placeable') return false;

		// Check placement limit (max 10 per player)
		const placedCount = await this.noctownPlacedItemsRepository.countBy({ playerId });
		if (placedCount >= 10) return false;

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

		return true;
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

		return result;
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

		const chickenId = this.idService.gen();
		await this.noctownChickensRepository.insert({
			id: chickenId,
			playerId,
			name: name ?? null,
			positionX: x,
			positionY: y,
			positionZ: z,
			hunger: 100,
			happiness: 100,
			eggsReady: 0,
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

		const cowId = this.idService.gen();
		await this.noctownCowsRepository.insert({
			id: cowId,
			playerId,
			name: name ?? null,
			positionX: x,
			positionY: y,
			positionZ: z,
			hunger: 100,
			happiness: 100,
			milkReady: 0,
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
}
