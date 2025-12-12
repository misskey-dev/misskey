/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import type { NoctownTradesRepository, NoctownPlayersRepository } from '@/models/_.js';
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
			id: 'd1e2f3a4-5678-90ab-cdef-111111111111',
		},
		tradeNotFound: {
			message: 'Trade not found.',
			code: 'TRADE_NOT_FOUND',
			id: 'd1e2f3a4-5678-90ab-cdef-222222222222',
		},
		notPartOfTrade: {
			message: 'You are not part of this trade.',
			code: 'NOT_PART_OF_TRADE',
			id: 'd1e2f3a4-5678-90ab-cdef-333333333333',
		},
		cannotCancelCompletedTrade: {
			message: 'Cannot cancel a completed trade.',
			code: 'CANNOT_CANCEL_COMPLETED_TRADE',
			id: 'd1e2f3a4-5678-90ab-cdef-444444444444',
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
	) {
		super(meta, paramDef, async (ps, me) => {
			// Get player
			const player = await this.playersRepository.findOneBy({ userId: me.id });
			if (!player) {
				throw new ApiError(meta.errors.playerNotFound);
			}

			// Get trade
			const trade = await this.tradesRepository.findOneBy({ id: ps.tradeId });
			if (!trade) {
				throw new ApiError(meta.errors.tradeNotFound);
			}

			// Check if player is part of trade
			if (trade.initiatorId !== player.id && trade.targetId !== player.id) {
				throw new ApiError(meta.errors.notPartOfTrade);
			}

			// Cannot cancel completed trade
			if (trade.status === 'completed') {
				throw new ApiError(meta.errors.cannotCancelCompletedTrade);
			}

			// Cancel trade
			await this.tradesRepository.update(
				{ id: trade.id },
				{
					status: 'cancelled',
					completedAt: new Date(),
				},
			);

			return { success: true };
		});
	}
}
