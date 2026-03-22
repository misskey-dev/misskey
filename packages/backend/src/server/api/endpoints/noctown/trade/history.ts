/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// T038: トレード履歴APIエンドポイント
// 仕様: 過去のトレード履歴（completed, cancelled, expired）を取得

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import type { NoctownPlayersRepository } from '@/models/_.js';
import { ApiError } from '@/server/api/error.js';
import { TradeService } from '@/misc/noctown/trade-service.js';

export const meta = {
	tags: ['noctown'],

	requireCredential: true,
	kind: 'read:account',

	res: {
		type: 'object',
		optional: false, nullable: false,
		properties: {
			trades: {
				type: 'array',
				items: {
					type: 'object',
					properties: {
						id: { type: 'string' },
						otherPlayerName: { type: 'string' },
						otherPlayerId: { type: 'string' },
						isInitiator: { type: 'boolean' },
						status: { type: 'string' },
						itemCount: { type: 'number' },
						currencyOffered: { type: 'number' },
						currencyRequested: { type: 'number' },
						message: { type: 'string', nullable: true },
						createdAt: { type: 'string' },
						expiresAt: { type: 'string' },
					},
				},
			},
			hasMore: { type: 'boolean' },
		},
	},

	errors: {
		playerNotFound: {
			message: 'Player not found.',
			code: 'PLAYER_NOT_FOUND',
			id: 'c1d2e3f4-0016-0008-0001-000000000001',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		limit: { type: 'integer', minimum: 1, maximum: 50, default: 20 },
		offset: { type: 'integer', minimum: 0, default: 0 },
	},
	required: [],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.noctownPlayersRepository)
		private noctownPlayersRepository: NoctownPlayersRepository,

		private tradeService: TradeService,
	) {
		super(meta, paramDef, async (ps, me) => {
			// Get player
			const player = await this.noctownPlayersRepository.findOneBy({ userId: me.id });
			if (!player) {
				throw new ApiError(meta.errors.playerNotFound);
			}

			const limit = ps.limit ?? 20;
			const offset = ps.offset ?? 0;

			// Get trade history
			const tradeItems = await this.tradeService.getTradeHistory(player.id, limit + 1, offset);

			// Check if there are more trades
			const hasMore = tradeItems.length > limit;
			if (hasMore) {
				tradeItems.pop();
			}

			// 仕様: Date型をISO文字列に変換してAPIレスポンスに適合
			const trades = tradeItems.map(trade => ({
				...trade,
				createdAt: trade.createdAt.toISOString(),
				expiresAt: trade.expiresAt.toISOString(),
			}));

			return {
				trades,
				hasMore,
			};
		});
	}
}
