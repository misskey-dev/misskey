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
						totalScore: { type: 'number' },
						isMe: { type: 'boolean' },
					},
				},
			},
			myRank: {
				type: 'object',
				nullable: true,
				properties: {
					rank: { type: 'number' },
					totalScore: { type: 'number' },
				},
			},
			totalPlayers: { type: 'number' },
		},
	},

	errors: {
		playerNotFound: {
			message: 'Player not found.',
			code: 'PLAYER_NOT_FOUND',
			id: 'c1d2e3f4-0025-0001-0001-000000000001',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 50 },
		offset: { type: 'integer', minimum: 0, default: 0 },
	},
	required: [],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject(DI.noctownPlayerScoresRepository)
		private noctownPlayerScoresRepository: NoctownPlayerScoresRepository,

		@Inject(DI.noctownPlayersRepository)
		private noctownPlayersRepository: NoctownPlayersRepository,

		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,
	) {
		super(meta, paramDef, async (ps, me) => {
			const player = await this.noctownPlayersRepository.findOneBy({ userId: me.id });
			if (!player) {
				throw new ApiError(meta.errors.playerNotFound);
			}

			// Get total count
			const totalPlayers = await this.noctownPlayerScoresRepository.count({
				where: {},
			});

			// Get rankings
			const scores = await this.noctownPlayerScoresRepository
				.createQueryBuilder('score')
				.leftJoinAndSelect('score.player', 'player')
				.orderBy('score.totalScore', 'DESC')
				.take(ps.limit ?? 50)
				.skip(ps.offset ?? 0)
				.getMany();

			// Get user info for each player
			const rankings = await Promise.all(scores.map(async (score, index) => {
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
					totalScore: score.totalScore,
					balanceScore: score.balanceScore,
					itemScore: score.itemScore,
					questScore: score.questScore,
					isMe: score.playerId === player.id,
				};
			}));

			// Get my rank
			let myRank: { rank: number; totalScore: number } | null = null;
			const myScore = await this.noctownPlayerScoresRepository.findOneBy({ playerId: player.id });
			if (myScore) {
				const higherCount = await this.noctownPlayerScoresRepository
					.createQueryBuilder('score')
					.where('score.totalScore > :score', { score: myScore.totalScore })
					.getCount();

				myRank = {
					rank: higherCount + 1,
					totalScore: myScore.totalScore,
				};
			}

			return {
				rankings,
				myRank,
				totalPlayers,
			};
		});
	}
}
