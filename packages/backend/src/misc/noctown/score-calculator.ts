/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable, Inject } from '@nestjs/common';
import { MoreThan } from 'typeorm';
import { DI } from '@/di-symbols.js';
import type {
	NoctownPlayersRepository,
	NoctownPlayerScoresRepository,
	NoctownPlayerStatisticsRepository,
	NoctownPlayerItemsRepository,
	NoctownWalletsRepository,
} from '@/models/_.js';
import { IdService } from '@/core/IdService.js';

// Score calculation window (30 days in milliseconds)
const SCORE_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

// Score weights for different activities
const SCORE_WEIGHTS = {
	balanceBase: 1,           // Base wallet balance score
	itemValue: 10,            // Per unique item owned
	itemRarityMultiplier: [1, 2, 5, 15, 50, 150], // Rarity 0-5
	questComplete: 100,       // Per quest completed
	questDifficultyBonus: 50, // Per difficulty level
	farmHarvest: 20,          // Per crop harvested
	livestockProduct: 30,     // Per livestock product collected
	craftItem: 25,            // Per item crafted
	tradeComplete: 50,        // Per successful trade
	tradeProfitRate: 0.1,     // Percentage of profit as score
};

export interface PlayerScoreBreakdown {
	playerId: string;
	totalScore: number;
	balanceScore: number;
	itemScore: number;
	questScore: number;
	speedScore: number;
	farmingScore: number;
	livestockScore: number;
	craftingScore: number;
	tradingScore: number;
	calculatedAt: Date;
}

@Injectable()
export class ScoreCalculatorService {
	constructor(
		@Inject(DI.noctownPlayersRepository)
		private playersRepository: NoctownPlayersRepository,

		@Inject(DI.noctownPlayerScoresRepository)
		private playerScoresRepository: NoctownPlayerScoresRepository,

		@Inject(DI.noctownPlayerStatisticsRepository)
		private playerStatisticsRepository: NoctownPlayerStatisticsRepository,

		@Inject(DI.noctownPlayerItemsRepository)
		private playerItemsRepository: NoctownPlayerItemsRepository,

		@Inject(DI.noctownWalletsRepository)
		private walletsRepository: NoctownWalletsRepository,

		private idService: IdService,
	) {}

	/**
	 * Calculate complete score breakdown for a player
	 */
	public async calculatePlayerScore(playerId: string): Promise<PlayerScoreBreakdown | null> {
		const player = await this.playersRepository.findOneBy({ id: playerId });
		if (!player) {
			return null;
		}

		const windowStart = new Date(Date.now() - SCORE_WINDOW_MS);

		// Calculate each score category
		const balanceScore = await this.calculateBalanceScore(playerId);
		const itemScore = await this.calculateItemScore(playerId);
		const questScore = await this.calculateQuestScore(playerId, windowStart);
		const speedScore = await this.calculateSpeedScore(playerId);
		const farmingScore = await this.calculateFarmingScore(playerId, windowStart);
		const livestockScore = await this.calculateLivestockScore(playerId, windowStart);
		const craftingScore = await this.calculateCraftingScore(playerId, windowStart);
		const tradingScore = await this.calculateTradingScore(playerId, windowStart);

		const totalScore = balanceScore + itemScore + questScore + speedScore +
			farmingScore + livestockScore + craftingScore + tradingScore;

		return {
			playerId,
			totalScore,
			balanceScore,
			itemScore,
			questScore,
			speedScore,
			farmingScore,
			livestockScore,
			craftingScore,
			tradingScore,
			calculatedAt: new Date(),
		};
	}

	/**
	 * Calculate balance score from wallet
	 */
	private async calculateBalanceScore(playerId: string): Promise<number> {
		const wallet = await this.walletsRepository.findOneBy({ playerId });
		if (!wallet) return 0;

		const balance = BigInt(wallet.balance);
		// Logarithmic scaling to prevent extreme values
		const score = Math.floor(Math.log10(Number(balance) + 1) * 100 * SCORE_WEIGHTS.balanceBase);
		return Math.max(0, score);
	}

	/**
	 * Calculate item collection score
	 */
	private async calculateItemScore(playerId: string): Promise<number> {
		const playerItems = await this.playerItemsRepository.find({
			where: { playerId },
			relations: ['item'],
		});

		let score = 0;
		for (const playerItem of playerItems) {
			if (!playerItem.item) continue;

			const rarityMultiplier = SCORE_WEIGHTS.itemRarityMultiplier[playerItem.item.rarity] ?? 1;
			const itemScore = SCORE_WEIGHTS.itemValue * rarityMultiplier;

			// Unique items get bonus
			if (playerItem.item.isUnique) {
				score += itemScore * 3;
			} else {
				score += itemScore;
			}
		}

		return score;
	}

	/**
	 * Calculate quest completion score
	 */
	private async calculateQuestScore(playerId: string, _windowStart: Date): Promise<number> {
		// Use statistics for quest count (simplified approach)
		const stats = await this.playerStatisticsRepository.findOneBy({ playerId });
		if (!stats) return 0;

		return stats.questsCompleted * SCORE_WEIGHTS.questComplete;
	}

	/**
	 * Calculate speed/efficiency score based on activity frequency
	 */
	private async calculateSpeedScore(playerId: string): Promise<number> {
		const stats = await this.playerStatisticsRepository.findOneBy({ playerId });
		if (!stats) return 0;

		// Based on quests per hour
		const playTimeHours = Number(stats.totalPlayTimeSeconds) / 3600;
		if (playTimeHours < 1) return 0;

		const questsPerHour = stats.questsCompleted / playTimeHours;

		// Efficiency score
		const score = Math.floor(questsPerHour * 50);
		return Math.min(score, 5000); // Cap at 5000
	}

	/**
	 * Calculate farming score (placeholder - based on item collection)
	 */
	private async calculateFarmingScore(playerId: string, _windowStart: Date): Promise<number> {
		// Farming score based on seed-type items owned
		const seedItems = await this.playerItemsRepository.find({
			where: { playerId },
			relations: ['item'],
		});

		let score = 0;
		for (const item of seedItems) {
			if (item.item?.itemType === 'seed') {
				score += SCORE_WEIGHTS.farmHarvest * item.quantity;
			}
		}
		return score;
	}

	/**
	 * Calculate livestock score (placeholder - based on feed items)
	 */
	private async calculateLivestockScore(playerId: string, _windowStart: Date): Promise<number> {
		// Livestock score based on feed-type items owned
		const feedItems = await this.playerItemsRepository.find({
			where: { playerId },
			relations: ['item'],
		});

		let score = 0;
		for (const item of feedItems) {
			if (item.item?.itemType === 'feed') {
				score += SCORE_WEIGHTS.livestockProduct * item.quantity;
			}
		}
		return score;
	}

	/**
	 * Calculate crafting score (placeholder - based on tool items)
	 */
	private async calculateCraftingScore(playerId: string, _windowStart: Date): Promise<number> {
		// Crafting score based on tool-type items owned
		const toolItems = await this.playerItemsRepository.find({
			where: { playerId },
			relations: ['item'],
		});

		let score = 0;
		for (const item of toolItems) {
			if (item.item?.itemType === 'tool') {
				score += SCORE_WEIGHTS.craftItem;
			}
		}
		return score;
	}

	/**
	 * Calculate trading score (placeholder - based on quest time)
	 */
	private async calculateTradingScore(playerId: string, _windowStart: Date): Promise<number> {
		const stats = await this.playerStatisticsRepository.findOneBy({ playerId });
		if (!stats) return 0;

		// Use quest time as proxy for activity
		const questTimeHours = Number(stats.totalQuestTimeSeconds) / 3600;
		return Math.floor(questTimeHours * SCORE_WEIGHTS.tradeComplete);
	}

	/**
	 * Update player's score in database
	 */
	public async updatePlayerScore(playerId: string): Promise<PlayerScoreBreakdown | null> {
		const breakdown = await this.calculatePlayerScore(playerId);
		if (!breakdown) return null;

		// Check if score record exists
		const existingScore = await this.playerScoresRepository.findOneBy({ playerId });

		if (existingScore) {
			// Update existing record
			await this.playerScoresRepository.update(
				{ playerId },
				{
					totalScore: breakdown.totalScore,
					balanceScore: breakdown.balanceScore,
					itemScore: breakdown.itemScore,
					questScore: breakdown.questScore,
					speedScore: breakdown.speedScore,
					calculatedAt: new Date(),
				},
			);
		} else {
			// Create new record
			await this.playerScoresRepository.insert({
				id: this.idService.gen(),
				playerId,
				totalScore: breakdown.totalScore,
				balanceScore: breakdown.balanceScore,
				itemScore: breakdown.itemScore,
				questScore: breakdown.questScore,
				speedScore: breakdown.speedScore,
			});
		}

		return breakdown;
	}

	/**
	 * Batch update scores for all active players
	 */
	public async updateAllScores(): Promise<{ updated: number; failed: number }> {
		const recentActivity = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // Active in last 7 days

		const activePlayers = await this.playersRepository.find({
			where: {
				lastActiveAt: MoreThan(recentActivity),
			},
		});

		let updated = 0;
		let failed = 0;

		for (const player of activePlayers) {
			try {
				await this.updatePlayerScore(player.id);
				updated++;
			} catch (e) {
				console.error(`Failed to update score for player ${player.id}:`, e);
				failed++;
			}
		}

		return { updated, failed };
	}

	/**
	 * Get top players for a category
	 */
	public async getTopPlayers(
		category: 'total' | 'balance' | 'item' | 'quest' | 'speed',
		limit: number = 50,
	): Promise<Array<{ playerId: string; score: number; rank: number }>> {
		const columnMap: Record<string, string> = {
			total: 'totalScore',
			balance: 'balanceScore',
			item: 'itemScore',
			quest: 'questScore',
			speed: 'speedScore',
		};
		const column = columnMap[category] ?? 'totalScore';

		const scores = await this.playerScoresRepository
			.createQueryBuilder('score')
			.orderBy(`score.${column}`, 'DESC')
			.take(limit)
			.getMany();

		return scores.map((score, index) => ({
			playerId: score.playerId,
			score: (score as unknown as Record<string, number>)[column],
			rank: index + 1,
		}));
	}
}
