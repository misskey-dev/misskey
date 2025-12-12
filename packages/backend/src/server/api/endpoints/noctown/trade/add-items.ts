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
			id: 'c1d2e3f4-0016-0006-0001-000000000001',
		},
		addItemsFailed: {
			message: 'Failed to add items to trade.',
			code: 'ADD_ITEMS_FAILED',
			id: 'c1d2e3f4-0016-0006-0001-000000000002',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		tradeId: { type: 'string' },
		items: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					playerItemId: { type: 'string' },
					quantity: { type: 'integer', minimum: 1 },
				},
				required: ['playerItemId', 'quantity'],
			},
		},
		currency: { type: 'integer', minimum: 0, default: 0 },
	},
	required: ['tradeId', 'items'],
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

			// Add items to trade
			const result = await this.tradeService.addItemsToTrade(
				ps.tradeId,
				player.id,
				ps.items,
				ps.currency ?? 0,
			);

			if (!result.success) {
				throw new ApiError(meta.errors.addItemsFailed);
			}

			return {
				success: true,
			};
		});
	}
}
