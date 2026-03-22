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
					},
				},
			},
		},
	},

	errors: {
		playerNotFound: {
			message: 'Player not found.',
			code: 'PLAYER_NOT_FOUND',
			id: 'c1d2e3f4-0016-0003-0001-000000000001',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {},
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

			// Get active trades
			const trades = await this.tradeService.getActiveTrades(player.id);

			return {
				trades,
			};
		});
	}
}
