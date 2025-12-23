/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import type { NoctownPlayersRepository } from '@/models/_.js';
import { ApiError } from '@/server/api/error.js';
import { TradeService } from '@/misc/noctown/trade-service.js';

export const meta = {
	tags: ['noctown'],

	requireCredential: true,
	kind: 'write:account',

	res: {
		type: 'object',
		optional: false, nullable: false,
		properties: {
			success: { type: 'boolean' },
		},
	},

	errors: {
		playerNotFound: {
			message: 'Player not found.',
			code: 'PLAYER_NOT_FOUND',
			id: 'c1d2e3f4-0016-0005-0001-000000000001',
		},
		tradeFailed: {
			message: 'Trade response failed.',
			code: 'TRADE_FAILED',
			id: 'c1d2e3f4-0016-0005-0001-000000000002',
		},
		tradeNotFound: {
			message: 'Trade not found or already processed.',
			code: 'TRADE_NOT_FOUND',
			id: 'c1d2e3f4-0016-0005-0001-000000000003',
		},
		tradeExpired: {
			message: 'Trade has expired.',
			code: 'TRADE_EXPIRED',
			id: 'c1d2e3f4-0016-0005-0001-000000000004',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		tradeId: { type: 'string' },
		response: { type: 'string', enum: ['accept', 'decline'] },
	},
	required: ['tradeId', 'response'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.noctownPlayersRepository)
		private noctownPlayersRepository: NoctownPlayersRepository,

		private tradeService: TradeService,
	) {
		super(meta, paramDef, async (ps, me) => {
			console.log('[Trade Respond API] Called:', { tradeId: ps.tradeId, response: ps.response, userId: me.id });

			// Get player
			const player = await this.noctownPlayersRepository.findOneBy({ userId: me.id });
			if (!player) {
				console.log('[Trade Respond API] Player not found for userId:', me.id);
				throw new ApiError(meta.errors.playerNotFound);
			}

			console.log('[Trade Respond API] Found player:', { playerId: player.id, userId: me.id });

			// Respond to trade
			const result = await this.tradeService.respondToTrade(
				ps.tradeId,
				player.id,
				ps.response as 'accept' | 'decline',
			);

			console.log('[Trade Respond API] Trade service result:', result);

			if (!result.success) {
				// 仕様: エラー理由に応じた詳細なエラーをスロー
				if (result.error === 'Trade not found or already processed') {
					throw new ApiError(meta.errors.tradeNotFound);
				} else if (result.error === 'Trade has expired') {
					throw new ApiError(meta.errors.tradeExpired);
				}
				throw new ApiError(meta.errors.tradeFailed);
			}

			return {
				success: true,
			};
		});
	}
}
