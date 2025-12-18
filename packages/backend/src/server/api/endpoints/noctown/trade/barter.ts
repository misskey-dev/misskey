/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import { IdService } from '@/core/IdService.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import type {
	NoctownPlayersRepository,
	NoctownTradesRepository,
	NoctownTradeItemsRepository,
	NoctownPlayerItemsRepository,
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
			tradeId: { type: 'string', nullable: true },
		},
	},

	errors: {
		playerNotFound: {
			message: 'Player not found.',
			code: 'PLAYER_NOT_FOUND',
			id: 'c1d2e3f4-0016-0001-0001-000000000001',
		},
		targetNotFound: {
			message: 'Target player not found.',
			code: 'TARGET_NOT_FOUND',
			id: 'c1d2e3f4-0016-0001-0001-000000000002',
		},
		targetOffline: {
			message: 'Target player is offline.',
			code: 'TARGET_OFFLINE',
			id: 'c1d2e3f4-0016-0001-0001-000000000003',
		},
		cannotTradeWithSelf: {
			message: 'Cannot trade with yourself.',
			code: 'CANNOT_TRADE_WITH_SELF',
			id: 'c1d2e3f4-0016-0001-0001-000000000004',
		},
		itemNotOwned: {
			message: 'You do not own this item.',
			code: 'ITEM_NOT_OWNED',
			id: 'c1d2e3f4-0016-0001-0001-000000000005',
		},
		insufficientQuantity: {
			message: 'Insufficient item quantity.',
			code: 'INSUFFICIENT_QUANTITY',
			id: 'c1d2e3f4-0016-0001-0001-000000000006',
		},
		activeTradePending: {
			message: 'You already have an active trade pending.',
			code: 'ACTIVE_TRADE_PENDING',
			id: 'c1d2e3f4-0016-0001-0001-000000000007',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		targetPlayerId: { type: 'string' },
		offeredItems: {
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
		offeredCurrency: { type: 'integer', minimum: 0, default: 0 },
		message: { type: 'string', maxLength: 200, nullable: true },
	},
	required: ['targetPlayerId', 'offeredItems'],
} as const;

const TRADE_EXPIRATION_MINUTES = 5;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.noctownPlayersRepository)
		private noctownPlayersRepository: NoctownPlayersRepository,

		@Inject(DI.noctownTradesRepository)
		private noctownTradesRepository: NoctownTradesRepository,

		@Inject(DI.noctownTradeItemsRepository)
		private noctownTradeItemsRepository: NoctownTradeItemsRepository,

		@Inject(DI.noctownPlayerItemsRepository)
		private noctownPlayerItemsRepository: NoctownPlayerItemsRepository,

		private idService: IdService,
		private globalEventService: GlobalEventService,
	) {
		super(meta, paramDef, async (ps, me) => {
			// Get initiator player
			const initiator = await this.noctownPlayersRepository.findOneBy({ userId: me.id });
			if (!initiator) {
				throw new ApiError(meta.errors.playerNotFound);
			}

			// Get target player
			const target = await this.noctownPlayersRepository.findOneBy({ id: ps.targetPlayerId });
			if (!target) {
				throw new ApiError(meta.errors.targetNotFound);
			}

			// Cannot trade with self
			if (initiator.id === target.id) {
				throw new ApiError(meta.errors.cannotTradeWithSelf);
			}

			// Check if target is online
			if (!target.isOnline) {
				throw new ApiError(meta.errors.targetOffline);
			}

			// Check for existing pending trades
			const existingTrade = await this.noctownTradesRepository.findOne({
				where: [
					{ initiatorId: initiator.id, status: 'pending' },
					{ initiatorId: initiator.id, status: 'accepted' },
				],
			});

			if (existingTrade) {
				throw new ApiError(meta.errors.activeTradePending);
			}

			// Validate offered items
			const validatedItems: Array<{ playerItemId: string; itemId: string; quantity: number }> = [];

			for (const offered of ps.offeredItems) {
				const playerItem = await this.noctownPlayerItemsRepository.findOne({
					where: {
						id: offered.playerItemId,
						playerId: initiator.id,
					},
				});

				if (!playerItem) {
					throw new ApiError(meta.errors.itemNotOwned);
				}

				if (playerItem.quantity < offered.quantity) {
					throw new ApiError(meta.errors.insufficientQuantity);
				}

				validatedItems.push({
					playerItemId: offered.playerItemId,
					itemId: playerItem.itemId,
					quantity: offered.quantity,
				});
			}

			// Create trade
			const tradeId = this.idService.gen();
			const expiresAt = new Date();
			expiresAt.setMinutes(expiresAt.getMinutes() + TRADE_EXPIRATION_MINUTES);

			await this.noctownTradesRepository.insert({
				id: tradeId,
				initiatorId: initiator.id,
				targetId: target.id,
				status: 'pending',
				initiatorCurrency: ps.offeredCurrency ?? 0,
				targetCurrency: 0,
				initiatorConfirmed: true,
				targetConfirmed: false,
				message: ps.message ?? null,
				expiresAt,
			});

			// Create trade items
			for (const item of validatedItems) {
				await this.noctownTradeItemsRepository.insert({
					id: this.idService.gen(),
					tradeId,
					itemId: item.itemId,
					quantity: item.quantity,
					isFromInitiator: true,
				});
			}

			// Notify target player
			this.globalEventService.publishNoctownPlayerStream(target.id, 'tradeRequest', {
				tradeId,
				initiatorId: initiator.id,
				initiatorUserId: initiator.userId,
				offeredItems: validatedItems.map(i => ({
					itemId: i.itemId,
					quantity: i.quantity,
				})),
				offeredCurrency: ps.offeredCurrency ?? 0,
				message: ps.message ?? null,
				expiresAt: expiresAt.toISOString(),
			});

			// 仕様: トレード状態変更イベントを発行（両プレイヤーがトレード中になった）
			this.globalEventService.publishNoctownStream('playerTradingStatusChanged', {
				playerId: initiator.id,
				isTrading: true,
			});
			this.globalEventService.publishNoctownStream('playerTradingStatusChanged', {
				playerId: target.id,
				isTrading: true,
			});

			return {
				success: true,
				tradeId,
			};
		});
	}
}
