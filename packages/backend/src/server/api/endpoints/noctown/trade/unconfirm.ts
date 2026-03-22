/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// 仕様: 交換OK解除エンドポイント
// 交換OKを押した後に解除し、再編集可能にする

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import type {
	NoctownTradesRepository,
	NoctownPlayersRepository,
} from '@/models/_.js';
import { ApiError } from '@/server/api/error.js';

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
			id: 'e1d2e3f4-5678-90ab-cdef-111111111111',
		},
		tradeNotFound: {
			message: 'Trade not found.',
			code: 'TRADE_NOT_FOUND',
			id: 'e1d2e3f4-5678-90ab-cdef-222222222222',
		},
		notPartOfTrade: {
			message: 'You are not part of this trade.',
			code: 'NOT_PART_OF_TRADE',
			id: 'e1d2e3f4-5678-90ab-cdef-333333333333',
		},
		tradeNotAccepted: {
			message: 'Trade is not in accepted status.',
			code: 'TRADE_NOT_ACCEPTED',
			id: 'e1d2e3f4-5678-90ab-cdef-444444444444',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		tradeId: { type: 'string' },
	},
	required: ['tradeId'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.noctownTradesRepository)
		private tradesRepository: NoctownTradesRepository,

		@Inject(DI.noctownPlayersRepository)
		private playersRepository: NoctownPlayersRepository,

		private globalEventService: GlobalEventService,
	) {
		super(meta, paramDef, async (ps, me) => {
			// プレイヤー取得
			const player = await this.playersRepository.findOneBy({ userId: me.id });
			if (!player) {
				throw new ApiError(meta.errors.playerNotFound);
			}

			// トレード取得
			const trade = await this.tradesRepository.findOneBy({ id: ps.tradeId });
			if (!trade) {
				throw new ApiError(meta.errors.tradeNotFound);
			}

			// 参加者確認
			const isInitiator = trade.initiatorId === player.id;
			const isTarget = trade.targetId === player.id;

			if (!isInitiator && !isTarget) {
				throw new ApiError(meta.errors.notPartOfTrade);
			}

			// ステータス確認
			if (trade.status !== 'accepted') {
				throw new ApiError(meta.errors.tradeNotAccepted);
			}

			// 確認フラグを解除
			if (isInitiator) {
				await this.tradesRepository.update(
					{ id: trade.id },
					{ initiatorConfirmed: false },
				);
			} else {
				await this.tradesRepository.update(
					{ id: trade.id },
					{ targetConfirmed: false },
				);
			}

			// 相手に確認解除を通知
			const otherPlayerId = isInitiator ? trade.targetId : trade.initiatorId;
			this.globalEventService.publishNoctownPlayerStream(otherPlayerId, 'tradeConfirmReset', {
				tradeId: trade.id,
				resetBy: player.id,
			});

			return { success: true };
		});
	}
}
