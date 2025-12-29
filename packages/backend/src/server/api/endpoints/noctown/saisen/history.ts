/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/**
 * 仕様: T032 GET /api/noctown/saisen/history
 * プレイヤーの賽銭履歴を取得する
 * - 直近のSAISEN_OFFERトランザクションを返す
 * - 累計金額も合わせて返す
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { NoctownPlayersRepository, NoctownTransactionLogsRepository } from '@/models/_.js';
import { DI } from '@/di-symbols.js';
import { NoctownService } from '@/core/NoctownService.js';
import { ApiError } from '@/server/api/error.js';

export const meta = {
	tags: ['noctown'],

	requireCredential: true as const,

	kind: 'read:account' as const,

	errors: {
		playerNotFound: {
			message: 'Player not found.',
			code: 'PLAYER_NOT_FOUND',
			id: 'f1c4a5b0-1234-5678-9abc-def012345678',
		},
	},

	res: {
		type: 'object' as const,
		optional: false as const,
		nullable: false as const,
		properties: {
			totalSaisen: {
				type: 'number' as const,
				optional: false as const,
				nullable: false as const,
				description: '累計奉納額',
			},
			nextMilestone: {
				type: 'number' as const,
				optional: false as const,
				nullable: false as const,
				description: '次のマイルストーン（500の倍数）',
			},
			remainingToMilestone: {
				type: 'number' as const,
				optional: false as const,
				nullable: false as const,
				description: '次のマイルストーンまでの残り金額',
			},
			history: {
				type: 'array' as const,
				optional: false as const,
				nullable: false as const,
				items: {
					type: 'object' as const,
					optional: false as const,
					nullable: false as const,
					properties: {
						id: {
							type: 'string' as const,
							optional: false as const,
							nullable: false as const,
						},
						amount: {
							type: 'number' as const,
							optional: false as const,
							nullable: false as const,
						},
						createdAt: {
							type: 'string' as const,
							optional: false as const,
							nullable: false as const,
							format: 'date-time',
						},
						mochiReward: {
							type: 'number' as const,
							optional: false as const,
							nullable: false as const,
						},
					},
				},
			},
		},
	},
} as const;

export const paramDef = {
	type: 'object' as const,
	properties: {
		limit: { type: 'integer' as const, minimum: 1, maximum: 100, default: 20 },
	},
	required: [] as const,
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject(DI.noctownPlayersRepository)
		private noctownPlayersRepository: NoctownPlayersRepository,

		@Inject(DI.noctownTransactionLogsRepository)
		private noctownTransactionLogsRepository: NoctownTransactionLogsRepository,

		private noctownService: NoctownService,
	) {
		super(meta, paramDef, async (ps, me) => {
			// プレイヤー取得
			const player = await this.noctownPlayersRepository.findOneBy({ userId: me.id });
			if (!player) {
				throw new ApiError(meta.errors.playerNotFound);
			}

			// 累計賽銭額を取得
			const totalSaisen = await this.noctownService.getTotalSaisen(player.id);

			// 次のマイルストーン計算
			const currentMilestone = Math.floor(totalSaisen / 500) * 500;
			const nextMilestone = currentMilestone + 500;
			const remainingToMilestone = nextMilestone - totalSaisen;

			// 履歴取得
			const logs = await this.noctownTransactionLogsRepository.find({
				where: {
					playerId: player.id,
					type: 'SAISEN_OFFER',
					isValid: true,
				},
				order: {
					createdAt: 'DESC',
				},
				take: ps.limit ?? 20,
			});

			const history = logs.map(log => ({
				id: log.id,
				amount: log.amount ?? 0,
				createdAt: log.createdAt.toISOString(),
				mochiReward: (log.metadata as { mochiAwarded?: number })?.mochiAwarded ?? 0,
			}));

			return {
				totalSaisen,
				nextMilestone,
				remainingToMilestone,
				history,
			};
		});
	}
}
