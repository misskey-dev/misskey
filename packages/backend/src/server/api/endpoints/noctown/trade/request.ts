/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import { NoctownTransactionService } from '@/core/NoctownTransactionService.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import type {
	NoctownTradesRepository,
	NoctownTradeItemsRepository,
	NoctownPlayersRepository,
	NoctownPlayerItemsRepository,
} from '@/models/_.js';
import { IdService } from '@/core/IdService.js';
import { ApiError } from '@/server/api/error.js';

export const meta = {
	tags: ['noctown'],

	requireCredential: true,
	kind: 'write:account',

	res: {
		type: 'object',
		optional: false, nullable: false,
		properties: {
			tradeId: { type: 'string' },
		},
	},

	errors: {
		playerNotFound: {
			message: 'Player not found.',
			code: 'PLAYER_NOT_FOUND',
			id: 'b1c2d3e4-5678-90ab-cdef-111111111111',
		},
		targetNotFound: {
			message: 'Target player not found.',
			code: 'TARGET_NOT_FOUND',
			id: 'b1c2d3e4-5678-90ab-cdef-222222222222',
		},
		cannotTradeWithSelf: {
			message: 'Cannot trade with yourself.',
			code: 'CANNOT_TRADE_WITH_SELF',
			id: 'b1c2d3e4-5678-90ab-cdef-333333333333',
		},
		insufficientItems: {
			message: 'You do not have enough items to offer.',
			code: 'INSUFFICIENT_ITEMS',
			id: 'b1c2d3e4-5678-90ab-cdef-444444444444',
		},
		existingTradeInProgress: {
			message: 'You already have a trade in progress with this player.',
			code: 'EXISTING_TRADE_IN_PROGRESS',
			id: 'b1c2d3e4-5678-90ab-cdef-555555555555',
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
					itemId: { type: 'string' },
					quantity: { type: 'integer', minimum: 1 },
				},
				required: ['itemId', 'quantity'],
			},
		},
		offeredCurrency: {
			type: 'integer',
			minimum: 0,
			default: 0,
		},
		message: {
			type: 'string',
			maxLength: 200,
			nullable: true,
		},
	},
	required: ['targetPlayerId'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.noctownTradesRepository)
		private tradesRepository: NoctownTradesRepository,

		@Inject(DI.noctownTradeItemsRepository)
		private tradeItemsRepository: NoctownTradeItemsRepository,

		@Inject(DI.noctownPlayersRepository)
		private playersRepository: NoctownPlayersRepository,

		@Inject(DI.noctownPlayerItemsRepository)
		private playerItemsRepository: NoctownPlayerItemsRepository,

		private idService: IdService,
		private noctownTransactionService: NoctownTransactionService,
		private globalEventService: GlobalEventService,
	) {
		super(meta, paramDef, async (ps, me) => {
			// Get initiator player
			const initiator = await this.playersRepository.findOneBy({ userId: me.id });
			if (!initiator) {
				throw new ApiError(meta.errors.playerNotFound);
			}

			// Get target player with user relation for username
			const target = await this.playersRepository.findOne({
				where: { id: ps.targetPlayerId },
				relations: ['user'],
			});
			if (!target) {
				throw new ApiError(meta.errors.targetNotFound);
			}

			// Cannot trade with self
			if (initiator.id === target.id) {
				throw new ApiError(meta.errors.cannotTradeWithSelf);
			}

			// Check for existing pending trade
			const existingTrade = await this.tradesRepository.findOne({
				where: [
					{ initiatorId: initiator.id, targetId: target.id, status: 'pending' },
					{ initiatorId: target.id, targetId: initiator.id, status: 'pending' },
				],
			});

			if (existingTrade) {
				throw new ApiError(meta.errors.existingTradeInProgress);
			}

			// Verify initiator has offered items
			if (ps.offeredItems && ps.offeredItems.length > 0) {
				const playerItems = await this.playerItemsRepository.find({
					where: { playerId: initiator.id },
				});

				const inventoryMap = new Map<string, number>();
				for (const pi of playerItems) {
					inventoryMap.set(pi.itemId, pi.quantity);
				}

				for (const offer of ps.offeredItems) {
					const have = inventoryMap.get(offer.itemId) ?? 0;
					if (have < offer.quantity) {
						throw new ApiError(meta.errors.insufficientItems);
					}
				}
			}

			// Create trade
			const tradeId = this.idService.gen();
			const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

			await this.tradesRepository.insert({
				id: tradeId,
				initiatorId: initiator.id,
				targetId: target.id,
				status: 'pending',
				initiatorCurrency: ps.offeredCurrency ?? 0,
				targetCurrency: 0,
				initiatorConfirmed: false,
				targetConfirmed: false,
				message: ps.message ?? null,
				expiresAt,
			});

			// Add offered items
			if (ps.offeredItems && ps.offeredItems.length > 0) {
				for (const offer of ps.offeredItems) {
					await this.tradeItemsRepository.insert({
						id: this.idService.gen(),
						tradeId,
						itemId: offer.itemId,
						quantity: offer.quantity,
						isFromInitiator: true,
					});
				}
			}

			// 仕様: FR-034 トレード作成のトランザクションログ
			await this.noctownTransactionService.createLog(
				'TRADE_CREATE',
				initiator.id,
				tradeId,
				ps.offeredCurrency ?? 0,
				null, // beforeState は無し（新規作成のため）
				{
					status: 'pending',
					ownerId: initiator.id,
				},
				{
					offeredItems: ps.offeredItems,
					offeredCurrency: ps.offeredCurrency ?? 0,
					message: ps.message,
				},
				target.id,
			);

			// 仕様: トレードリクエストをWebSocketで相手に通知
			this.globalEventService.publishNoctownPlayerStream(target.id, 'tradeRequest', {
				tradeId,
				initiatorId: initiator.id,
				initiatorUserId: initiator.userId,
				offeredItems: (ps.offeredItems ?? []).map(i => ({
					itemId: i.itemId,
					quantity: i.quantity,
				})),
				offeredCurrency: ps.offeredCurrency ?? 0,
				message: ps.message ?? null,
				expiresAt: expiresAt.toISOString(),
			});

			// 仕様: T009 送信者にトレードリクエスト送信確認イベントを通知
			this.globalEventService.publishNoctownPlayerStream(initiator.id, 'tradeRequestSent', {
				tradeId,
				targetId: target.id,
				targetUsername: target.user?.username ?? '',
				status: 'pending',
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
				tradeId,
			};
		});
	}
}
