/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import type {
	NoctownPlayersRepository,
	NoctownTradesRepository,
	NoctownTradeItemsRepository,
	NoctownItemsRepository,
} from '@/models/_.js';
import { ApiError } from '@/server/api/error.js';

export const meta = {
	tags: ['noctown'],

	requireCredential: true,
	kind: 'read:account',

	res: {
		type: 'object',
		optional: false, nullable: false,
		properties: {
			id: { type: 'string' },
			initiatorId: { type: 'string' },
			targetId: { type: 'string' },
			initiatorUsername: { type: 'string' },
			targetUsername: { type: 'string' },
			status: { type: 'string' },
			initiatorItems: { type: 'array' },
			targetItems: { type: 'array' },
			initiatorCurrency: { type: 'number' },
			targetCurrency: { type: 'number' },
			initiatorConfirmed: { type: 'boolean' },
			targetConfirmed: { type: 'boolean' },
			message: { type: 'string', nullable: true },
			expiresAt: { type: 'string' },
		},
	},

	errors: {
		playerNotFound: {
			message: 'Player not found.',
			code: 'PLAYER_NOT_FOUND',
			id: 'c1d2e3f4-0016-0004-0001-000000000001',
		},
		tradeNotFound: {
			message: 'Trade not found.',
			code: 'TRADE_NOT_FOUND',
			id: 'c1d2e3f4-0016-0004-0001-000000000002',
		},
		notParticipant: {
			message: 'You are not a participant in this trade.',
			code: 'NOT_PARTICIPANT',
			id: 'c1d2e3f4-0016-0004-0001-000000000003',
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
		@Inject(DI.noctownPlayersRepository)
		private noctownPlayersRepository: NoctownPlayersRepository,

		@Inject(DI.noctownTradesRepository)
		private noctownTradesRepository: NoctownTradesRepository,

		@Inject(DI.noctownTradeItemsRepository)
		private noctownTradeItemsRepository: NoctownTradeItemsRepository,

		@Inject(DI.noctownItemsRepository)
		private noctownItemsRepository: NoctownItemsRepository,
	) {
		super(meta, paramDef, async (ps, me) => {
			// Get player
			const player = await this.noctownPlayersRepository.findOneBy({ userId: me.id });
			if (!player) {
				throw new ApiError(meta.errors.playerNotFound);
			}

			// Get trade
			const trade = await this.noctownTradesRepository.findOneBy({ id: ps.tradeId });
			if (!trade) {
				throw new ApiError(meta.errors.tradeNotFound);
			}

			// Verify participant
			if (trade.initiatorId !== player.id && trade.targetId !== player.id) {
				throw new ApiError(meta.errors.notParticipant);
			}

			// Get players info
			const initiator = await this.noctownPlayersRepository.findOne({
				where: { id: trade.initiatorId },
				relations: ['user'],
			});
			const target = await this.noctownPlayersRepository.findOne({
				where: { id: trade.targetId },
				relations: ['user'],
			});

			// Get trade items
			const tradeItems = await this.noctownTradeItemsRepository.findBy({ tradeId: trade.id });

			// Get item details
			const initiatorItems = [];
			const targetItems = [];

			for (const ti of tradeItems) {
				const item = await this.noctownItemsRepository.findOneBy({ id: ti.itemId });
				const itemData = {
					itemId: ti.itemId,
					name: item?.name ?? 'Unknown',
					quantity: ti.quantity,
				};

				if (ti.isFromInitiator) {
					initiatorItems.push(itemData);
				} else {
					targetItems.push(itemData);
				}
			}

			return {
				id: trade.id,
				initiatorId: trade.initiatorId,
				targetId: trade.targetId,
				initiatorUsername: initiator?.user?.username ?? 'Unknown',
				targetUsername: target?.user?.username ?? 'Unknown',
				status: trade.status,
				initiatorItems,
				targetItems,
				initiatorCurrency: trade.initiatorCurrency,
				targetCurrency: trade.targetCurrency,
				initiatorConfirmed: trade.initiatorConfirmed,
				targetConfirmed: trade.targetConfirmed,
				message: trade.message,
				expiresAt: trade.expiresAt.toISOString(),
			};
		});
	}
}
