/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/**
 * 仕様: T031 POST /api/noctown/saisen/offer
 * 賽銭を奉納し、鏡餅アイテムを獲得する
 * - amount: 奉納額（1以上の正の整数）
 * - 残高不足の場合はINSUFFICIENT_BALANCEエラー
 * - 初回奉納で鏡餅1個、累計500コインごとに追加1個
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { NoctownPlayersRepository, NoctownWalletsRepository } from '@/models/_.js';
import { DI } from '@/di-symbols.js';
import { NoctownService } from '@/core/NoctownService.js';
import { ApiError } from '@/server/api/error.js';

export const meta = {
	tags: ['noctown'],

	requireCredential: true as const,

	kind: 'write:account' as const,

	errors: {
		playerNotFound: {
			message: 'Player not found.',
			code: 'PLAYER_NOT_FOUND',
			id: 'e1c4a5b0-1234-5678-9abc-def012345678',
		},
		invalidAmount: {
			message: 'Amount must be a positive integer.',
			code: 'INVALID_AMOUNT',
			id: 'e2c4a5b0-2234-5678-9abc-def012345679',
		},
		insufficientBalance: {
			message: 'Insufficient balance.',
			code: 'INSUFFICIENT_BALANCE',
			id: 'e3c4a5b0-3234-5678-9abc-def012345680',
		},
	},

	res: {
		type: 'object' as const,
		optional: false as const,
		nullable: false as const,
		properties: {
			success: {
				type: 'boolean' as const,
				optional: false as const,
				nullable: false as const,
			},
			mochiCount: {
				type: 'number' as const,
				optional: false as const,
				nullable: false as const,
				description: '獲得した鏡餅の数',
			},
			milestonesCrossed: {
				type: 'array' as const,
				optional: false as const,
				nullable: false as const,
				items: {
					type: 'number' as const,
					optional: false as const,
					nullable: false as const,
				},
				description: '到達したマイルストーン（500の倍数）',
			},
			newBalance: {
				type: 'number' as const,
				optional: false as const,
				nullable: false as const,
				description: '奉納後の残高',
			},
			totalSaisen: {
				type: 'number' as const,
				optional: false as const,
				nullable: false as const,
				description: '累計奉納額',
			},
		},
	},
} as const;

export const paramDef = {
	type: 'object' as const,
	properties: {
		amount: { type: 'integer' as const, minimum: 1 },
	},
	required: ['amount'] as const,
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject(DI.noctownPlayersRepository)
		private noctownPlayersRepository: NoctownPlayersRepository,

		@Inject(DI.noctownWalletsRepository)
		private noctownWalletsRepository: NoctownWalletsRepository,

		private noctownService: NoctownService,
	) {
		super(meta, paramDef, async (ps, me) => {
			// プレイヤー取得
			const player = await this.noctownPlayersRepository.findOneBy({ userId: me.id });
			if (!player) {
				throw new ApiError(meta.errors.playerNotFound);
			}

			// 残高確認
			const wallet = await this.noctownWalletsRepository.findOneBy({ playerId: player.id });
			const walletBalance = wallet ? parseInt(wallet.balance, 10) : 0;
			if (!wallet || walletBalance < ps.amount) {
				throw new ApiError(meta.errors.insufficientBalance);
			}

			// 賽銭処理
			const result = await this.noctownService.offerSaisen(player.id, ps.amount);

			if (!result.success) {
				if (result.error === 'INSUFFICIENT_BALANCE') {
					throw new ApiError(meta.errors.insufficientBalance);
				}
				if (result.error === 'INVALID_AMOUNT') {
					throw new ApiError(meta.errors.invalidAmount);
				}
				throw new ApiError(meta.errors.playerNotFound);
			}

			// 更新後の残高と累計を取得
			const updatedWallet = await this.noctownWalletsRepository.findOneBy({ playerId: player.id });
			const totalSaisen = await this.noctownService.getTotalSaisen(player.id);
			const newBalance = updatedWallet ? parseInt(updatedWallet.balance, 10) : 0;

			return {
				success: true,
				mochiCount: result.mochiCount ?? 0,
				milestonesCrossed: result.milestonesCrossed ?? [],
				newBalance,
				totalSaisen,
			};
		});
	}
}
