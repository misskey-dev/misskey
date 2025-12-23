/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import { NoctownTransactionService } from '@/core/NoctownTransactionService.js';
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
			status: { type: 'string' },
		},
	},

	errors: {
		playerNotFound: {
			message: 'Player not found.',
			code: 'PLAYER_NOT_FOUND',
			id: 'c1d2e3f4-5678-90ab-cdef-111111111111',
		},
		tradeNotFound: {
			message: 'Trade not found.',
			code: 'TRADE_NOT_FOUND',
			id: 'c1d2e3f4-5678-90ab-cdef-222222222222',
		},
		notPartOfTrade: {
			message: 'You are not part of this trade.',
			code: 'NOT_PART_OF_TRADE',
			id: 'c1d2e3f4-5678-90ab-cdef-333333333333',
		},
		tradeExpired: {
			message: 'Trade has expired.',
			code: 'TRADE_EXPIRED',
			id: 'c1d2e3f4-5678-90ab-cdef-444444444444',
		},
		tradeNotConfirmable: {
			message: 'Trade is not in a confirmable status.',
			code: 'TRADE_NOT_CONFIRMABLE',
			id: 'c1d2e3f4-5678-90ab-cdef-555555555555',
		},
		insufficientFunds: {
			message: 'Insufficient funds.',
			code: 'INSUFFICIENT_FUNDS',
			id: 'c1d2e3f4-5678-90ab-cdef-666666666666',
		},
		insufficientItems: {
			message: 'Insufficient items.',
			code: 'INSUFFICIENT_ITEMS',
			id: 'c1d2e3f4-5678-90ab-cdef-777777777777',
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
		private noctownTransactionService: NoctownTransactionService,
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
			const isInitiator = trade.initiatorId === player.id;
			const isTarget = trade.targetId === player.id;

			if (!isInitiator && !isTarget) {
				throw new ApiError(meta.errors.notPartOfTrade);
			}

			// Check trade status - allow both pending and accepted
			if (trade.status !== 'pending' && trade.status !== 'accepted') {
				throw new ApiError(meta.errors.tradeNotConfirmable);
			}

			// Check if expired
			if (new Date() > trade.expiresAt) {
				await this.tradesRepository.update({ id: trade.id }, { status: 'expired' });
				throw new ApiError(meta.errors.tradeExpired);
			}

			// Set confirmation flag
			if (isInitiator) {
				trade.initiatorConfirmed = true;
			} else {
				trade.targetConfirmed = true;
			}

			await this.tradesRepository.update(
				{ id: trade.id },
				isInitiator
					? { initiatorConfirmed: true }
					: { targetConfirmed: true },
			);

			// 仕様: 両者確認時は自動実行せず、confirmだけ行う
			// 実際の交換は execute エンドポイントで行う
			return { success: true, status: 'confirmed' };
		});
	}

	private async executeTrade(tradeId: string): Promise<void> {
		const trade = await this.tradesRepository.findOneBy({ id: tradeId });
		if (!trade) return;

		const tradeItems = await this.tradeItemsRepository.find({
			where: { tradeId },
		});

		await this.db.transaction(async (manager) => {
			// Get wallets
			const initiatorWallet = await manager.findOne(
				this.walletsRepository.target,
				{ where: { playerId: trade.initiatorId } },
			);
			const targetWallet = await manager.findOne(
				this.walletsRepository.target,
				{ where: { playerId: trade.targetId } },
			);

			// Transfer currency
			if (trade.initiatorCurrency > 0) {
				if (!initiatorWallet || BigInt(initiatorWallet.balance) < BigInt(trade.initiatorCurrency)) {
					throw new Error('Insufficient funds');
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
					throw new Error('Insufficient funds');
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

			// Transfer items
			for (const tradeItem of tradeItems) {
				const fromPlayerId = tradeItem.isFromInitiator ? trade.initiatorId : trade.targetId;
				const toPlayerId = tradeItem.isFromInitiator ? trade.targetId : trade.initiatorId;

				// Remove from sender
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
					throw new Error('Insufficient items');
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

				// Add to receiver
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

			// Mark trade as completed
			await manager.update(
				this.tradesRepository.target,
				{ id: tradeId },
				{
					status: 'completed',
					completedAt: new Date(),
				},
			);
		});

		// 仕様: FR-034 トレード完了のトランザクションログ
		await this.noctownTransactionService.createLog(
			'TRADE_COMPLETE',
			trade.initiatorId,
			tradeId,
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
	}
}
