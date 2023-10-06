/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import * as Redis from 'ioredis';
import type { MiNote } from '@/models/_.js';
import { DI } from '@/di-symbols.js';
import { bindThis } from '@/decorators.js';

const GLOBAL_NOTES_RANKING_WINDOW = 1000 * 60 * 60 * 24 * 3; // 3日ごと

@Injectable()
export class FeaturedService {
	constructor(
		@Inject(DI.redis)
		private redisClient: Redis.Redis,
	) {
	}

	@bindThis
	private getCurrentPerUserFriendRankingWindow(): number {
		const passed = new Date().getTime() - new Date(new Date().getFullYear(), 0, 1).getTime();
		return Math.floor(passed / (1000 * 60 * 60 * 24 * 7)); // 1週間ごと
	}

	@bindThis
	private getCurrentGlobalNotesRankingWindow(): number {
		const passed = new Date().getTime() - new Date(new Date().getFullYear(), 0, 1).getTime();
		return Math.floor(passed / GLOBAL_NOTES_RANKING_WINDOW);
	}

	@bindThis
	public async updateGlobalNotesRanking(noteId: MiNote['id'], score = 1): Promise<void> {
		// TODO: フォロワー数の多い人が常にランキング上位になるのを防ぎたい
		const currentWindow = this.getCurrentGlobalNotesRankingWindow();
		const redisTransaction = this.redisClient.multi();
		redisTransaction.zincrby(
			`featuredGlobalNotesRanking:${currentWindow}`,
			score.toString(),
			noteId);
		redisTransaction.expire(
			`featuredGlobalNotesRanking:${currentWindow}`,
			(GLOBAL_NOTES_RANKING_WINDOW * 3) / 1000,
			'NX'); // "NX -- Set expiry only when the key has no expiry" = 有効期限がないときだけ設定
		await redisTransaction.exec();
	}

	@bindThis
	public async updateInChannelNotesRanking(noteId: MiNote['id'], channelId: MiNote['channelId'], score = 1): Promise<void> {
		const currentWindow = this.getCurrentGlobalNotesRankingWindow();
		const redisTransaction = this.redisClient.multi();
		redisTransaction.zincrby(
			`featuredInChannelNotesRanking:${channelId}:${currentWindow}`,
			score.toString(),
			noteId);
		redisTransaction.expire(
			`featuredInChannelNotesRanking:${channelId}:${currentWindow}`,
			(GLOBAL_NOTES_RANKING_WINDOW * 3) / 1000,
			'NX'); // "NX -- Set expiry only when the key has no expiry" = 有効期限がないときだけ設定
		await redisTransaction.exec();
	}

	@bindThis
	public async getGlobalNotesRanking(limit: number): Promise<MiNote['id'][]> {
		const currentWindow = this.getCurrentGlobalNotesRankingWindow();
		const previousWindow = currentWindow - 1;

		const [currentRankingResult, previousRankingResult] = await Promise.all([
			this.redisClient.zrange(
				`featuredGlobalNotesRanking:${currentWindow}`, 0, limit, 'REV', 'WITHSCORES'),
			this.redisClient.zrange(
				`featuredGlobalNotesRanking:${previousWindow}`, 0, limit, 'REV', 'WITHSCORES'),
		]);

		const ranking = new Map<MiNote['id'], number>();
		for (let i = 0; i < currentRankingResult.length; i += 2) {
			const noteId = currentRankingResult[i];
			const score = parseInt(currentRankingResult[i + 1], 10);
			ranking.set(noteId, score);
		}
		for (let i = 0; i < previousRankingResult.length; i += 2) {
			const noteId = previousRankingResult[i];
			const score = parseInt(previousRankingResult[i + 1], 10);
			const exist = ranking.get(noteId);
			if (exist != null) {
				ranking.set(noteId, (exist + score) / 2);
			} else {
				ranking.set(noteId, score);
			}
		}

		return Array.from(ranking.keys());
	}

	@bindThis
	public async getInChannelNotesRanking(channelId: MiNote['channelId'], limit: number): Promise<MiNote['id'][]> {
		const currentWindow = this.getCurrentGlobalNotesRankingWindow();
		const previousWindow = currentWindow - 1;

		const [currentRankingResult, previousRankingResult] = await Promise.all([
			this.redisClient.zrange(
				`featuredInChannelNotesRanking:${channelId}:${currentWindow}`, 0, limit, 'REV', 'WITHSCORES'),
			this.redisClient.zrange(
				`featuredInChannelNotesRanking:${channelId}:${previousWindow}`, 0, limit, 'REV', 'WITHSCORES'),
		]);

		const ranking = new Map<MiNote['id'], number>();
		for (let i = 0; i < currentRankingResult.length; i += 2) {
			const noteId = currentRankingResult[i];
			const score = parseInt(currentRankingResult[i + 1], 10);
			ranking.set(noteId, score);
		}
		for (let i = 0; i < previousRankingResult.length; i += 2) {
			const noteId = previousRankingResult[i];
			const score = parseInt(previousRankingResult[i + 1], 10);
			const exist = ranking.get(noteId);
			if (exist != null) {
				ranking.set(noteId, (exist + score) / 2);
			} else {
				ranking.set(noteId, score);
			}
		}

		return Array.from(ranking.keys());
	}
}
