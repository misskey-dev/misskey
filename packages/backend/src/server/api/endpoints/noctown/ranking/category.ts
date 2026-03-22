/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import type {
	NoctownPlayerScoresRepository,
	NoctownPlayersRepository,
	NoctownPlayerStatisticsRepository,
	UsersRepository,
} from '@/models/_.js';
import { ApiError } from '@/server/api/error.js';

export const meta = {
	tags: ['noctown'],
	requireCredential: true,
	kind: 'read:account',

	res: {
		type: 'object',
		properties: {
			rankings: {
				type: 'array',
				items: {
					type: 'object',
					properties: {
						rank: { type: 'number' },
						playerId: { type: 'string' },
						username: { type: 'string' },
						avatarUrl: { type: 'string', nullable: true },
						score: { type: 'number' },
						isMe: { type: 'boolean' },
					},
				},
			},
			myRank: {
				type: 'object',
				nullable: true,
				properties: {
					rank: { type: 'number' },
					score: { type: 'number' },
				},
			},
		},
	},

	errors: {
		playerNotFound: {
			message: 'Player not found.',
			code: 'PLAYER_NOT_FOUND',
			id: 'c1d2e3f4-0026-0001-0001-000000000001',
		},
		invalidCategory: {
			message: 'Invalid category.',
			code: 'INVALID_CATEGORY',
			id: 'c1d2e3f4-0026-0001-0001-000000000002',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		category: {
			type: 'string',
			enum: ['balance', 'item', 'quest', 'speed', 'quests_completed', 'play_time'],
		},
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 50 },
		offset: { type: 'integer', minimum: 0, default: 0 },
	},
	required: ['category'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject(DI.noctownPlayerScoresRepository)
		private noctownPlayerScoresRepository: NoctownPlayerScoresRepository,

		@Inject(DI.noctownPlayersRepository)
		private noctownPlayersRepository: NoctownPlayersRepository,

		@Inject(DI.noctownPlayerStatisticsRepository)
		private noctownPlayerStatisticsRepository: NoctownPlayerStatisticsRepository,

		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,
	) {
		super(meta, paramDef, async (ps, me) => {
			const player = await this.noctownPlayersRepository.findOneBy({ userId: me.id });
			if (!player) {
				throw new ApiError(meta.errors.playerNotFound);
			}

			// Score-based categories
			const scoreCategories = ['balance', 'item', 'quest', 'speed'];
			// Statistics-based categories
			const statsCategories = ['quests_completed', 'play_time'];

			let rankings: Array<{
				rank: number;
				playerId: string;
				username: string;
				avatarUrl: string | null;
				score: number;
				isMe: boolean;
			}> = [];
			let myRank: { rank: number; score: number } | null = null;

			if (scoreCategories.includes(ps.category)) {
				// Get from player_score table
				const columnMap: Record<string, string> = {
					balance: 'balanceScore',
					item: 'itemScore',
					quest: 'questScore',
					speed: 'speedScore',
				};
				const column = columnMap[ps.category];

				const scores = await this.noctownPlayerScoresRepository
					.createQueryBuilder('score')
					.orderBy(`score.${column}`, 'DESC')
					.take(ps.limit ?? 50)
					.skip(ps.offset ?? 0)
					.getMany();

				rankings = await Promise.all(scores.map(async (score, index) => {
					const playerData = await this.noctownPlayersRepository.findOneBy({ id: score.playerId });
					let username = 'Unknown';
					let avatarUrl: string | null = null;

					if (playerData) {
						const user = await this.usersRepository.findOneBy({ id: playerData.userId });
						if (user) {
							username = user.username;
							avatarUrl = user.avatarUrl;
						}
					}

					return {
						rank: (ps.offset ?? 0) + index + 1,
						playerId: score.playerId,
						username,
						avatarUrl,
						score: (score as unknown as Record<string, number>)[column],
						isMe: score.playerId === player.id,
					};
				}));

				// Get my rank
				const myScore = await this.noctownPlayerScoresRepository.findOneBy({ playerId: player.id });
				if (myScore) {
					const higherCount = await this.noctownPlayerScoresRepository
						.createQueryBuilder('score')
						.where(`score.${column} > :score`, { score: (myScore as unknown as Record<string, number>)[column] })
						.getCount();

					myRank = {
						rank: higherCount + 1,
						score: (myScore as unknown as Record<string, number>)[column],
					};
				}
			} else if (statsCategories.includes(ps.category)) {
				// Get from player_statistics table
				const columnMap: Record<string, string> = {
					quests_completed: 'questsCompleted',
					play_time: 'totalPlayTimeSeconds',
				};
				const column = columnMap[ps.category];

				const stats = await this.noctownPlayerStatisticsRepository
					.createQueryBuilder('stats')
					.orderBy(`stats.${column}`, 'DESC')
					.take(ps.limit ?? 50)
					.skip(ps.offset ?? 0)
					.getMany();

				rankings = await Promise.all(stats.map(async (stat, index) => {
					const playerData = await this.noctownPlayersRepository.findOneBy({ id: stat.playerId });
					let username = 'Unknown';
					let avatarUrl: string | null = null;

					if (playerData) {
						const user = await this.usersRepository.findOneBy({ id: playerData.userId });
						if (user) {
							username = user.username;
							avatarUrl = user.avatarUrl;
						}
					}

					const scoreValue = ps.category === 'quests_completed'
						? stat.questsCompleted
						: Number(stat.totalPlayTimeSeconds);

					return {
						rank: (ps.offset ?? 0) + index + 1,
						playerId: stat.playerId,
						username,
						avatarUrl,
						score: scoreValue,
						isMe: stat.playerId === player.id,
					};
				}));

				// Get my rank
				const myStats = await this.noctownPlayerStatisticsRepository.findOneBy({ playerId: player.id });
				if (myStats) {
					const myScoreValue = ps.category === 'quests_completed'
						? myStats.questsCompleted
						: Number(myStats.totalPlayTimeSeconds);

					const higherCount = await this.noctownPlayerStatisticsRepository
						.createQueryBuilder('stats')
						.where(`stats.${column} > :score`, { score: myScoreValue })
						.getCount();

					myRank = {
						rank: higherCount + 1,
						score: myScoreValue,
					};
				}
			} else {
				throw new ApiError(meta.errors.invalidCategory);
			}

			return {
				rankings,
				myRank,
			};
		});
	}
}
