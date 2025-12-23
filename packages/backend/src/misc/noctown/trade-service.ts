/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createHash } from 'node:crypto';
import { Injectable, Inject } from '@nestjs/common';
import { LessThan, MoreThan, In } from 'typeorm';
import { DI } from '@/di-symbols.js';
import { IdService } from '@/core/IdService.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import type {
	NoctownTradesRepository,
	NoctownTradeItemsRepository,
	NoctownPlayersRepository,
	NoctownPlayerItemsRepository,
	NoctownWalletsRepository,
	NoctownItemsRepository,
} from '@/models/_.js';

export type TradeResponse = 'accept' | 'decline';

export interface TradeResult {
	success: boolean;
	error?: string;
}

export interface TradeListItem {
	id: string;
	otherPlayerName: string;
	otherPlayerId: string;
	isInitiator: boolean;
	status: string;
	itemCount: number;
	currencyOffered: number;
	currencyRequested: number;
	message: string | null;
	createdAt: Date;
	expiresAt: Date;
}

@Injectable()
export class TradeService {
	constructor(
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

		// T020: アイテム名取得用
		@Inject(DI.noctownItemsRepository)
		private itemsRepository: NoctownItemsRepository,

		private idService: IdService,
		private globalEventService: GlobalEventService,
	) {}

	/**
	 * Get active trades for a player
	 * 仕様: pending, accepted のトレードに加え、5分以内に拒否されたトレードも返す
	 */
	public async getActiveTrades(playerId: string): Promise<TradeListItem[]> {
		// 5分以内に拒否されたトレードも取得
		const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

		const trades = await this.tradesRepository.find({
			where: [
				{ initiatorId: playerId, status: In(['pending', 'accepted']) },
				{ targetId: playerId, status: In(['pending', 'accepted']) },
				// 自分が送信したトレードで最近拒否されたもの
				{ initiatorId: playerId, status: 'declined', completedAt: MoreThan(fiveMinutesAgo) },
			],
			order: { createdAt: 'DESC' },
		});

		const result: TradeListItem[] = [];

		for (const trade of trades) {
			const isInitiator = trade.initiatorId === playerId;
			const otherPlayerId = isInitiator ? trade.targetId : trade.initiatorId;

			// Get other player info
			const otherPlayer = await this.playersRepository.findOne({
				where: { id: otherPlayerId },
				relations: ['user'],
			});

			// Count items in trade
			const itemCount = await this.tradeItemsRepository.count({
				where: { tradeId: trade.id },
			});

			result.push({
				id: trade.id,
				otherPlayerName: otherPlayer?.user?.username ?? 'Unknown',
				otherPlayerId,
				isInitiator,
				status: trade.status,
				itemCount,
				currencyOffered: isInitiator ? trade.initiatorCurrency : trade.targetCurrency,
				currencyRequested: isInitiator ? trade.targetCurrency : trade.initiatorCurrency,
				message: trade.message,
				createdAt: trade.createdAt,
				expiresAt: trade.expiresAt,
			});
		}

		return result;
	}

	/**
	 * Get trade history for a player
	 */
	public async getTradeHistory(
		playerId: string,
		limit: number = 20,
		offset: number = 0,
	): Promise<TradeListItem[]> {
		const trades = await this.tradesRepository.find({
			where: [
				{ initiatorId: playerId, status: In(['completed', 'cancelled', 'expired']) },
				{ targetId: playerId, status: In(['completed', 'cancelled', 'expired']) },
			],
			order: { completedAt: 'DESC' },
			take: limit,
			skip: offset,
		});

		const result: TradeListItem[] = [];

		for (const trade of trades) {
			const isInitiator = trade.initiatorId === playerId;
			const otherPlayerId = isInitiator ? trade.targetId : trade.initiatorId;

			const otherPlayer = await this.playersRepository.findOne({
				where: { id: otherPlayerId },
				relations: ['user'],
			});

			const itemCount = await this.tradeItemsRepository.count({
				where: { tradeId: trade.id },
			});

			result.push({
				id: trade.id,
				otherPlayerName: otherPlayer?.user?.username ?? 'Unknown',
				otherPlayerId,
				isInitiator,
				status: trade.status,
				itemCount,
				currencyOffered: isInitiator ? trade.initiatorCurrency : trade.targetCurrency,
				currencyRequested: isInitiator ? trade.targetCurrency : trade.initiatorCurrency,
				message: trade.message,
				createdAt: trade.createdAt,
				expiresAt: trade.expiresAt,
			});
		}

		return result;
	}

	/**
	 * Cleanup expired trades
	 */
	public async cleanupExpiredTrades(): Promise<number> {
		const result = await this.tradesRepository.update(
			{
				status: 'pending',
				expiresAt: LessThan(new Date()),
			},
			{
				status: 'expired',
				completedAt: new Date(),
			},
		);

		return result.affected ?? 0;
	}

	/**
	 * Get pending trade count for a player (for notifications)
	 */
	public async getPendingTradeCount(playerId: string): Promise<number> {
		return await this.tradesRepository.count({
			where: { targetId: playerId, status: 'pending' },
		});
	}

	/**
	 * 仕様: プレイヤーが現在トレード中かどうかを判定
	 * pending または accepted ステータスのトレードに参加している場合はトレード中
	 */
	public async isPlayerTrading(playerId: string): Promise<boolean> {
		const count = await this.tradesRepository.count({
			where: [
				{ initiatorId: playerId, status: In(['pending', 'accepted']) },
				{ targetId: playerId, status: In(['pending', 'accepted']) },
			],
		});
		return count > 0;
	}

	/**
	 * 仕様: 複数プレイヤーのトレード中状態を一括取得
	 * パフォーマンス最適化: nearby players取得時に使用
	 */
	public async getPlayersTradeStatus(playerIds: string[]): Promise<Map<string, boolean>> {
		if (playerIds.length === 0) {
			return new Map();
		}

		// アクティブなトレードに参加しているプレイヤーIDを取得
		const activeTrades = await this.tradesRepository.find({
			where: [
				{ initiatorId: In(playerIds), status: In(['pending', 'accepted']) },
				{ targetId: In(playerIds), status: In(['pending', 'accepted']) },
			],
			select: ['initiatorId', 'targetId'],
		});

		const tradingPlayerIds = new Set<string>();
		for (const trade of activeTrades) {
			if (playerIds.includes(trade.initiatorId)) {
				tradingPlayerIds.add(trade.initiatorId);
			}
			if (playerIds.includes(trade.targetId)) {
				tradingPlayerIds.add(trade.targetId);
			}
		}

		const result = new Map<string, boolean>();
		for (const playerId of playerIds) {
			result.set(playerId, tradingPlayerIds.has(playerId));
		}
		return result;
	}

	/**
	 * 仕様: プレイヤーが他にトレード中でなければ、トレード状態変更イベントを発行
	 * トレード終了時に呼び出す（複数トレードに参加している場合を考慮）
	 */
	private async publishTradeStatusChangedIfNotTrading(playerId: string): Promise<void> {
		const stillTrading = await this.isPlayerTrading(playerId);
		if (!stillTrading) {
			this.globalEventService.publishNoctownStream('playerTradingStatusChanged', {
				playerId,
				isTrading: false,
			});
		}
	}

	/**
	 * Check if players can trade (e.g., not blocked, not in cooldown)
	 */
	public async canPlayersTraded(
		player1Id: string,
		player2Id: string,
	): Promise<{ canTrade: boolean; reason?: string }> {
		// Check for too many recent trades (rate limiting)
		const recentTradeCount = await this.tradesRepository.count({
			where: [
				{ initiatorId: player1Id, targetId: player2Id },
				{ initiatorId: player2Id, targetId: player1Id },
			],
		});

		// Simple rate limit: max 10 trades between same players per hour
		// (In production, you'd check createdAt within last hour)
		if (recentTradeCount > 50) {
			return {
				canTrade: false,
				reason: 'Too many recent trades between these players',
			};
		}

		return { canTrade: true };
	}

	/**
	 * Target player responds to a trade request (dual-confirmation step 1)
	 */
	public async respondToTrade(tradeId: string, targetPlayerId: string, response: TradeResponse): Promise<TradeResult> {
		console.log('[Trade Service] respondToTrade called:', { tradeId, targetPlayerId, response });

		const trade = await this.tradesRepository.findOne({
			where: { id: tradeId, targetId: targetPlayerId, status: 'pending' },
		});

		console.log('[Trade Service] Trade found:', trade ? { id: trade.id, initiatorId: trade.initiatorId, targetId: trade.targetId, status: trade.status } : 'null');

		if (!trade) {
			return { success: false, error: 'Trade not found or already processed' };
		}

		// Check if trade has expired
		if (new Date() > trade.expiresAt) {
			await this.tradesRepository.update({ id: tradeId }, { status: 'expired', completedAt: new Date() });
			return { success: false, error: 'Trade has expired' };
		}

		if (response === 'decline') {
			await this.tradesRepository.update({ id: tradeId }, { status: 'declined', completedAt: new Date() });

			// T016: 送信者と受信者の情報を取得
			const [initiator, target] = await Promise.all([
				this.playersRepository.findOne({ where: { id: trade.initiatorId }, relations: ['user'] }),
				this.playersRepository.findOne({ where: { id: trade.targetId }, relations: ['user'] }),
			]);

			// T016: Notify initiator（送信者に拒否されたことを通知）
			this.globalEventService.publishNoctownPlayerStream(trade.initiatorId, 'tradeDeclined', {
				tradeId,
				targetId: trade.targetId,
				targetUsername: target?.user?.username ?? '',
			});

			// 仕様: トレード状態変更イベントを発行（両プレイヤーがトレード終了）
			await this.publishTradeStatusChangedIfNotTrading(trade.initiatorId);
			await this.publishTradeStatusChangedIfNotTrading(trade.targetId);

			return { success: true };
		}

		// Accept - move to accepted status
		console.log('[Trade Service] Accepting trade:', tradeId);
		await this.tradesRepository.update({ id: tradeId }, { status: 'accepted' });

		// T016: 送信者と受信者の情報を取得
		const [initiator, target] = await Promise.all([
			this.playersRepository.findOne({ where: { id: trade.initiatorId }, relations: ['user'] }),
			this.playersRepository.findOne({ where: { id: trade.targetId }, relations: ['user'] }),
		]);
		console.log('[Trade Service] Player info loaded:', {
			initiator: initiator ? { id: initiator.id, username: initiator.user?.username } : 'null',
			target: target ? { id: target.id, username: target.user?.username } : 'null',
		});

		// 仕様: トレード承認時に両者にイベント送信し、直接バーターモードでパネルを開く
		// avatarUrlを含めることで、フロントエンドでPlayerDataとして使用可能
		const acceptedEventData = {
			tradeId,
			initiatorId: trade.initiatorId,
			targetId: trade.targetId,
			initiatorUsername: initiator?.user?.username ?? '',
			targetUsername: target?.user?.username ?? '',
			initiatorAvatarUrl: initiator?.user?.avatarUrl ?? null,
			targetAvatarUrl: target?.user?.avatarUrl ?? null,
		};
		console.log('[Trade Service] Publishing tradeAccepted event:', {
			initiatorId: trade.initiatorId,
			targetId: trade.targetId,
			tradeId,
		});
		this.globalEventService.publishNoctownPlayerStream(trade.initiatorId, 'tradeAccepted', acceptedEventData);
		this.globalEventService.publishNoctownPlayerStream(trade.targetId, 'tradeAccepted', acceptedEventData);

		return { success: true };
	}

	/**
	 * Add items to trade (for target player after accepting)
	 */
	public async addItemsToTrade(
		tradeId: string,
		playerId: string,
		items: Array<{ playerItemId: string; quantity: number }>,
		currency: number = 0,
	): Promise<TradeResult> {
		const trade = await this.tradesRepository.findOne({
			where: { id: tradeId, status: 'accepted' },
		});

		if (!trade) {
			return { success: false, error: 'Trade not found or not in accepted status' };
		}

		// Determine if this is initiator or target
		const isInitiator = trade.initiatorId === playerId;
		const isTarget = trade.targetId === playerId;

		if (!isInitiator && !isTarget) {
			return { success: false, error: 'You are not part of this trade' };
		}

		// Validate items ownership
		for (const item of items) {
			const playerItem = await this.playerItemsRepository.findOne({
				where: { id: item.playerItemId, playerId },
			});

			if (!playerItem) {
				return { success: false, error: 'Item not owned' };
			}

			if (playerItem.quantity < item.quantity) {
				return { success: false, error: 'Insufficient item quantity' };
			}

			// Add to trade items
			await this.tradeItemsRepository.insert({
				id: this.idService.gen(),
				tradeId,
				itemId: playerItem.itemId,
				quantity: item.quantity,
				isFromInitiator: isInitiator,
			});
		}

		// Update currency
		if (isTarget) {
			await this.tradesRepository.update({ id: tradeId }, { targetCurrency: currency });
		}

		// T026: アイテム/通貨が変更されたので確認状態をリセット
		const wasConfirmed = trade.initiatorConfirmed || trade.targetConfirmed;
		if (wasConfirmed) {
			await this.tradesRepository.update({ id: tradeId }, {
				initiatorConfirmed: false,
				targetConfirmed: false,
			});

			// T027: 両者に確認リセットイベントを通知
			const resetEventData = { tradeId, resetBy: playerId };
			this.globalEventService.publishNoctownPlayerStream(trade.initiatorId, 'tradeConfirmReset', resetEventData);
			this.globalEventService.publishNoctownPlayerStream(trade.targetId, 'tradeConfirmReset', resetEventData);
		}

		// T020: アイテム名を含む詳細情報を取得
		const itemsWithDetails = await Promise.all(
			items.map(async (item) => {
				const playerItem = await this.playerItemsRepository.findOne({
					where: { id: item.playerItemId },
				});
				const itemInfo = playerItem ? await this.itemsRepository.findOneBy({ id: playerItem.itemId }) : null;
				return {
					itemId: playerItem?.itemId ?? '',
					itemName: itemInfo?.name ?? 'Unknown',
					quantity: item.quantity,
				};
			}),
		);

		// T020: Notify other party with tradeItemsChanged event
		const otherPlayerId = isInitiator ? trade.targetId : trade.initiatorId;
		this.globalEventService.publishNoctownPlayerStream(otherPlayerId, 'tradeItemsChanged', {
			tradeId,
			items: itemsWithDetails,
			currency,
			isFromInitiator: isInitiator,
		});

		return { success: true };
	}

	/**
	 * T041-T042: トランザクションID生成
	 * 仕様: アイテムID一覧とノクタコイン金額を含むハッシュを生成
	 */
	private async generateTransactionId(tradeId: string, playerId: string): Promise<string> {
		// トレードアイテムを取得
		const tradeItems = await this.tradeItemsRepository.find({
			where: { tradeId },
			order: { itemId: 'ASC' }, // 一貫性のためソート
		});

		// トレード情報を取得
		const trade = await this.tradesRepository.findOneBy({ id: tradeId });
		if (!trade) {
			throw new Error('Trade not found');
		}

		const isInitiator = trade.initiatorId === playerId;

		// 自分が提供するアイテムのみを対象
		const myItems = tradeItems.filter(item => item.isFromInitiator === isInitiator);
		const myCurrency = isInitiator ? trade.initiatorCurrency : trade.targetCurrency;

		// ハッシュ用データを構築
		const hashData = {
			tradeId,
			playerId,
			items: myItems.map(item => ({
				itemId: item.itemId,
				quantity: item.quantity,
			})),
			currency: myCurrency,
			timestamp: Date.now(),
		};

		// SHA-256ハッシュを生成
		const hash = createHash('sha256')
			.update(JSON.stringify(hashData))
			.digest('hex');

		return hash;
	}

	/**
	 * T043: トランザクションID検証
	 * 仕様: 両者のトランザクションIDが記録されているか検証
	 */
	private async verifyTransactionIds(trade: { initiatorTransactionId: string | null; targetTransactionId: string | null }): Promise<{ valid: boolean; error?: string }> {
		// T044: トランザクションID改ざん検知エラー処理
		if (!trade.initiatorTransactionId) {
			return { valid: false, error: 'Initiator transaction ID missing - possible tampering detected' };
		}
		if (!trade.targetTransactionId) {
			return { valid: false, error: 'Target transaction ID missing - possible tampering detected' };
		}
		return { valid: true };
	}

	/**
	 * Confirm trade (both parties must confirm) - dual-confirmation step 2
	 * T041: 「交換OK」押下時のトランザクションID発行ロジック
	 * T045: target側がトレード実行を行うロジックに変更
	 */
	public async confirmTrade(tradeId: string, playerId: string): Promise<TradeResult> {
		const trade = await this.tradesRepository.findOne({
			where: { id: tradeId, status: 'accepted' },
		});

		if (!trade) {
			return { success: false, error: 'Trade not found or not in accepted status' };
		}

		const isInitiator = trade.initiatorId === playerId;
		const isTarget = trade.targetId === playerId;

		if (!isInitiator && !isTarget) {
			return { success: false, error: 'You are not part of this trade' };
		}

		// T041: トランザクションID発行（「交換OK」押下時）
		const transactionId = await this.generateTransactionId(tradeId, playerId);

		// Update confirmation status with transaction ID
		if (isInitiator) {
			await this.tradesRepository.update({ id: tradeId }, {
				initiatorConfirmed: true,
				initiatorTransactionId: transactionId,
			});
		} else {
			await this.tradesRepository.update({ id: tradeId }, {
				targetConfirmed: true,
				targetTransactionId: transactionId,
			});
		}

		// Check if both confirmed
		const updatedTrade = await this.tradesRepository.findOneBy({ id: tradeId });
		if (!updatedTrade) {
			return { success: false, error: 'Trade not found' };
		}

		if (updatedTrade.initiatorConfirmed && updatedTrade.targetConfirmed) {
			// T043: トランザクションID検証
			const verification = await this.verifyTransactionIds(updatedTrade);
			if (!verification.valid) {
				// T044: 改ざん検知時はトレードを失敗させる
				await this.tradesRepository.update({ id: tradeId }, { status: 'failed', completedAt: new Date() });
				return { success: false, error: verification.error };
			}

			// T045: target側がトレード実行を行う（最後に確認した側が実行）
			return await this.executeTrade(tradeId);
		}

		// Notify other party of confirmation
		const otherPlayerId = isInitiator ? trade.targetId : trade.initiatorId;
		this.globalEventService.publishNoctownPlayerStream(otherPlayerId, 'tradeConfirmed', {
			tradeId,
			confirmedBy: isInitiator ? 'initiator' : 'target',
		});

		return { success: true };
	}

	/**
	 * Execute the trade - transfer items and currency
	 */
	private async executeTrade(tradeId: string): Promise<TradeResult> {
		const trade = await this.tradesRepository.findOneBy({ id: tradeId });
		if (!trade) {
			return { success: false, error: 'Trade not found' };
		}

		// Get trade items
		const tradeItems = await this.tradeItemsRepository.findBy({ tradeId });

		// Get players
		const initiator = await this.playersRepository.findOneBy({ id: trade.initiatorId });
		const target = await this.playersRepository.findOneBy({ id: trade.targetId });

		if (!initiator || !target) {
			await this.tradesRepository.update({ id: tradeId }, { status: 'failed', completedAt: new Date() });
			return { success: false, error: 'Player not found' };
		}

		// Get wallets for currency validation
		const initiatorWallet = await this.walletsRepository.findOneBy({ playerId: trade.initiatorId });
		const targetWallet = await this.walletsRepository.findOneBy({ playerId: trade.targetId });

		// Validate currency (balance is bigint stored as string)
		if (trade.initiatorCurrency > 0 && (!initiatorWallet || BigInt(initiatorWallet.balance) < BigInt(trade.initiatorCurrency))) {
			await this.tradesRepository.update({ id: tradeId }, { status: 'failed', completedAt: new Date() });
			return { success: false, error: 'Initiator has insufficient currency' };
		}
		if (trade.targetCurrency > 0 && (!targetWallet || BigInt(targetWallet.balance) < BigInt(trade.targetCurrency))) {
			await this.tradesRepository.update({ id: tradeId }, { status: 'failed', completedAt: new Date() });
			return { success: false, error: 'Target has insufficient currency' };
		}

		// Transfer items from initiator to target
		const initiatorItems = tradeItems.filter(i => i.isFromInitiator);
		for (const item of initiatorItems) {
			await this.transferItem(trade.initiatorId, trade.targetId, item.itemId, item.quantity);
		}

		// Transfer items from target to initiator
		const targetItems = tradeItems.filter(i => !i.isFromInitiator);
		for (const item of targetItems) {
			await this.transferItem(trade.targetId, trade.initiatorId, item.itemId, item.quantity);
		}

		// Transfer currency
		if (trade.initiatorCurrency > 0) {
			await this.walletsRepository.decrement({ playerId: trade.initiatorId }, 'balance', trade.initiatorCurrency);
			await this.walletsRepository.increment({ playerId: trade.targetId }, 'balance', trade.initiatorCurrency);
		}
		if (trade.targetCurrency > 0) {
			await this.walletsRepository.decrement({ playerId: trade.targetId }, 'balance', trade.targetCurrency);
			await this.walletsRepository.increment({ playerId: trade.initiatorId }, 'balance', trade.targetCurrency);
		}

		// Mark trade as completed
		await this.tradesRepository.update({ id: tradeId }, { status: 'completed', completedAt: new Date() });

		// Notify both parties
		this.globalEventService.publishNoctownPlayerStream(trade.initiatorId, 'tradeCompleted', { tradeId });
		this.globalEventService.publishNoctownPlayerStream(trade.targetId, 'tradeCompleted', { tradeId });

		// 仕様: トレード状態変更イベントを発行（両プレイヤーがトレード終了）
		await this.publishTradeStatusChangedIfNotTrading(trade.initiatorId);
		await this.publishTradeStatusChangedIfNotTrading(trade.targetId);

		return { success: true };
	}

	/**
	 * Transfer item between players
	 */
	private async transferItem(fromPlayerId: string, toPlayerId: string, itemId: string, quantity: number): Promise<void> {
		// Reduce from sender
		const fromItem = await this.playerItemsRepository.findOne({
			where: { playerId: fromPlayerId, itemId },
		});

		if (fromItem) {
			if (fromItem.quantity <= quantity) {
				await this.playerItemsRepository.delete({ id: fromItem.id });
			} else {
				await this.playerItemsRepository.decrement({ id: fromItem.id }, 'quantity', quantity);
			}
		}

		// Add to receiver
		const toItem = await this.playerItemsRepository.findOne({
			where: { playerId: toPlayerId, itemId },
		});

		if (toItem) {
			await this.playerItemsRepository.increment({ id: toItem.id }, 'quantity', quantity);
		} else {
			await this.playerItemsRepository.insert({
				id: this.idService.gen(),
				playerId: toPlayerId,
				itemId,
				quantity,
			});
		}
	}

	/**
	 * Cancel a trade
	 */
	public async cancelTrade(tradeId: string, playerId: string): Promise<TradeResult> {
		const trade = await this.tradesRepository.findOne({
			where: [
				{ id: tradeId, initiatorId: playerId },
				{ id: tradeId, targetId: playerId },
			],
		});

		if (!trade) {
			return { success: false, error: 'Trade not found' };
		}

		if (trade.status === 'completed' || trade.status === 'failed') {
			return { success: false, error: 'Trade already finalized' };
		}

		await this.tradesRepository.update({ id: tradeId }, { status: 'cancelled', completedAt: new Date() });

		// Notify other party
		const otherPlayerId = trade.initiatorId === playerId ? trade.targetId : trade.initiatorId;
		this.globalEventService.publishNoctownPlayerStream(otherPlayerId, 'tradeCancelled', { tradeId });

		// 仕様: トレード状態変更イベントを発行（両プレイヤーがトレード終了）
		await this.publishTradeStatusChangedIfNotTrading(trade.initiatorId);
		await this.publishTradeStatusChangedIfNotTrading(trade.targetId);

		return { success: true };
	}

	/**
	 * T034: プレイヤー切断時のアクティブトレードをキャンセル
	 * 仕様: プレイヤーがオフラインになった際、進行中のトレードを自動キャンセル
	 */
	public async cancelActiveTradesOnDisconnect(playerId: string): Promise<void> {
		// pending または accepted 状態のトレードを取得
		const activeTrades = await this.tradesRepository.find({
			where: [
				{ initiatorId: playerId, status: In(['pending', 'accepted']) },
				{ targetId: playerId, status: In(['pending', 'accepted']) },
			],
		});

		for (const trade of activeTrades) {
			// トレードをキャンセル
			await this.tradesRepository.update({ id: trade.id }, { status: 'cancelled', completedAt: new Date() });

			// 相手に切断によるキャンセルを通知
			const otherPlayerId = trade.initiatorId === playerId ? trade.targetId : trade.initiatorId;
			this.globalEventService.publishNoctownPlayerStream(otherPlayerId, 'tradeCancelled', {
				tradeId: trade.id,
				cancelledBy: playerId,
				reason: 'disconnected',
			});

			// トレード状態変更イベントを発行
			await this.publishTradeStatusChangedIfNotTrading(trade.initiatorId);
			await this.publishTradeStatusChangedIfNotTrading(trade.targetId);
		}
	}
}
