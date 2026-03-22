/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// 仕様: 交換実行エンドポイント
// 両者が交換OKを押した状態で、交換ボタンを押すと実行される

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
	NoctownWalletsRepository,
} from '@/models/_.js';
import { IdService } from '@/core/IdService.js';
import { ApiError } from '@/server/api/error.js';
import { DataSource } from 'typeorm';

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
			id: 'f1d2e3f4-5678-90ab-cdef-111111111111',
		},
		tradeNotFound: {
			message: 'Trade not found.',
			code: 'TRADE_NOT_FOUND',
			id: 'f1d2e3f4-5678-90ab-cdef-222222222222',
		},
		notPartOfTrade: {
			message: 'You are not part of this trade.',
			code: 'NOT_PART_OF_TRADE',
			id: 'f1d2e3f4-5678-90ab-cdef-333333333333',
		},
		tradeNotAccepted: {
			message: 'Trade is not in accepted status.',
			code: 'TRADE_NOT_ACCEPTED',
			id: 'f1d2e3f4-5678-90ab-cdef-444444444444',
		},
		bothNotConfirmed: {
			message: 'Both parties must confirm before executing.',
			code: 'BOTH_NOT_CONFIRMED',
			id: 'f1d2e3f4-5678-90ab-cdef-555555555555',
		},
		insufficientFunds: {
			message: 'Insufficient funds.',
			code: 'INSUFFICIENT_FUNDS',
			id: 'f1d2e3f4-5678-90ab-cdef-666666666666',
		},
		insufficientItems: {
			message: 'Insufficient items.',
			code: 'INSUFFICIENT_ITEMS',
			id: 'f1d2e3f4-5678-90ab-cdef-777777777777',
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
		@Inject(DI.db)
		private db: DataSource,

		@Inject(DI.noctownTradesRepository)
		private tradesRepository: NoctownTradesRepository,

		@Inject(DI.noctownTradeItemsRepository)
		private tradeItemsRepository: NoctownTradeItemsRepository,

		@Inject(DI.noctownPlayersRepository)
		private playersRepository: NoctownPlayersRepository,

		@Inject(DI.noctownPlayerItemsRepository)
		private playerItemsRepository: NoctownPlayerItemsRepository,

		@Inject(DI.noctownWalletsRepository)
		private walletsRepository: NoctownWalletsRepository,

		private idService: IdService,
		private globalEventService: GlobalEventService,
		private noctownTransactionService: NoctownTransactionService,
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

			// 両者の確認状態を確認
			if (!trade.initiatorConfirmed || !trade.targetConfirmed) {
				throw new ApiError(meta.errors.bothNotConfirmed);
			}

			// 交換実行
			const tradeItems = await this.tradeItemsRepository.find({
				where: { tradeId: trade.id },
			});

			await this.db.transaction(async (manager) => {
				// ウォレット取得
				const initiatorWallet = await manager.findOne(
					this.walletsRepository.target,
					{ where: { playerId: trade.initiatorId } },
				);
				const targetWallet = await manager.findOne(
					this.walletsRepository.target,
					{ where: { playerId: trade.targetId } },
				);

				// 通貨移動
				if (trade.initiatorCurrency > 0) {
					if (!initiatorWallet || BigInt(initiatorWallet.balance) < BigInt(trade.initiatorCurrency)) {
						throw new ApiError(meta.errors.insufficientFunds);
					}
					await manager.decrement(
						this.walletsRepository.target,
						{ playerId: trade.initiatorId },
						'balance',
						trade.initiatorCurrency,
					);
					if (targetWallet) {
						await manager.increment(
							this.walletsRepository.target,
							{ playerId: trade.targetId },
							'balance',
							trade.initiatorCurrency,
						);
					}
				}

				if (trade.targetCurrency > 0) {
					if (!targetWallet || BigInt(targetWallet.balance) < BigInt(trade.targetCurrency)) {
						throw new ApiError(meta.errors.insufficientFunds);
					}
					await manager.decrement(
						this.walletsRepository.target,
						{ playerId: trade.targetId },
						'balance',
						trade.targetCurrency,
					);
					if (initiatorWallet) {
						await manager.increment(
							this.walletsRepository.target,
							{ playerId: trade.initiatorId },
							'balance',
							trade.targetCurrency,
						);
					}
				}

				// アイテム移動
				for (const tradeItem of tradeItems) {
					const fromPlayerId = tradeItem.isFromInitiator ? trade.initiatorId : trade.targetId;
					const toPlayerId = tradeItem.isFromInitiator ? trade.targetId : trade.initiatorId;

					// 送信者からアイテムを減らす
					const senderItem = await manager.findOne(
						this.playerItemsRepository.target,
						{
							where: {
								playerId: fromPlayerId,
								itemId: tradeItem.itemId,
							},
						},
					);

					if (!senderItem || senderItem.quantity < tradeItem.quantity) {
						throw new ApiError(meta.errors.insufficientItems);
					}

					if (senderItem.quantity === tradeItem.quantity) {
						await manager.delete(
							this.playerItemsRepository.target,
							{ id: senderItem.id },
						);
					} else {
						await manager.decrement(
							this.playerItemsRepository.target,
							{ id: senderItem.id },
							'quantity',
							tradeItem.quantity,
						);
					}

					// 受信者にアイテムを追加
					const receiverItem = await manager.findOne(
						this.playerItemsRepository.target,
						{
							where: {
								playerId: toPlayerId,
								itemId: tradeItem.itemId,
							},
						},
					);

					if (receiverItem) {
						await manager.increment(
							this.playerItemsRepository.target,
							{ id: receiverItem.id },
							'quantity',
							tradeItem.quantity,
						);
					} else {
						await manager.insert(
							this.playerItemsRepository.target,
							{
								id: this.idService.gen(),
								playerId: toPlayerId,
								itemId: tradeItem.itemId,
								quantity: tradeItem.quantity,
							},
						);
					}
				}

				// トレード完了にマーク
				await manager.update(
					this.tradesRepository.target,
					{ id: trade.id },
					{
						status: 'completed',
						completedAt: new Date(),
					},
				);
			});

			// 両者にトレード完了を通知
			this.globalEventService.publishNoctownPlayerStream(trade.initiatorId, 'tradeCompleted', {
				tradeId: trade.id,
			});
			this.globalEventService.publishNoctownPlayerStream(trade.targetId, 'tradeCompleted', {
				tradeId: trade.id,
			});

			// 仕様: トレード完了のトランザクションログを記録
			await this.noctownTransactionService.createLog(
				'TRADE_COMPLETE',
				trade.initiatorId,
				trade.id,
				trade.initiatorCurrency + trade.targetCurrency,
				{
					status: 'pending',
				},
				{
					status: 'traded',
				},
				{
					initiatorCurrency: trade.initiatorCurrency,
					targetCurrency: trade.targetCurrency,
					tradeItems: tradeItems.map(ti => ({
						itemId: ti.itemId,
						quantity: ti.quantity,
						isFromInitiator: ti.isFromInitiator,
					})),
				},
				trade.targetId,
			);

			return { success: true };
		});
	}
}
