/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import { bindThis } from '@/decorators.js';
import { IdService } from '@/core/IdService.js';
import type {
	NoctownTransactionLogsRepository,
	NoctownPlayerItemsRepository,
	NoctownDroppedItemsRepository,
	NoctownPlacedItemsRepository,
	NoctownPlayersRepository,
} from '@/models/_.js';
import type { NoctownTransactionType, NoctownTransactionState } from '@/models/noctown/NoctownTransactionLog.js';
import type { NoctownTransactionLog } from '@/models/noctown/NoctownTransactionLog.js';

// 仕様: FR-034 アイテムトランザクションログシステム
// トランザクション記録・検証・レガシーモード判定を行うサービス

// 状態遷移ルール（どのタイプでどの遷移が許可されるか）
const stateTransitionRules: Record<NoctownTransactionType, {
	allowedBeforeStatus?: string[];
	expectedAfterStatus?: string;
	checkOwner?: boolean;
}> = {
	ITEM_DROP: {
		allowedBeforeStatus: ['active'],
		expectedAfterStatus: 'dropped',
		checkOwner: true,
	},
	ITEM_PICKUP: {
		allowedBeforeStatus: ['dropped'],
		expectedAfterStatus: 'picked_up',
		checkOwner: false, // 誰でも拾える
	},
	ITEM_PLACE: {
		allowedBeforeStatus: ['active'],
		expectedAfterStatus: 'placed',
		checkOwner: true,
	},
	ITEM_RETRIEVE: {
		allowedBeforeStatus: ['placed'],
		expectedAfterStatus: 'retrieved',
		checkOwner: true, // 設置者のみ回収可能
	},
	TRADE_CREATE: {},
	TRADE_ACCEPT: {},
	TRADE_DECLINE: {},
	TRADE_COMPLETE: {},
	TRADE_CANCEL: {},
	PET_CREATE: {},
	PET_DELETE: {
		checkOwner: true,
	},
	CURRENCY_DEPOSIT: {},
	CURRENCY_WITHDRAW: {},
	CURRENCY_TRADE: {},
	FISHING_START: {},
	FISHING_COMPLETE: {},
	FISHING_CANCEL: {},
	CONTAINER_SET: {
		checkOwner: true,
	},
	CONTAINER_OPEN: {
		checkOwner: true,
	},
};

@Injectable()
export class NoctownTransactionService {
	constructor(
		@Inject(DI.noctownTransactionLogsRepository)
		private noctownTransactionLogsRepository: NoctownTransactionLogsRepository,

		@Inject(DI.noctownPlayerItemsRepository)
		private noctownPlayerItemsRepository: NoctownPlayerItemsRepository,

		@Inject(DI.noctownDroppedItemsRepository)
		private noctownDroppedItemsRepository: NoctownDroppedItemsRepository,

		@Inject(DI.noctownPlacedItemsRepository)
		private noctownPlacedItemsRepository: NoctownPlacedItemsRepository,

		@Inject(DI.noctownPlayersRepository)
		private noctownPlayersRepository: NoctownPlayersRepository,

		private idService: IdService,
	) {}

	/**
	 * トランザクションログを作成
	 * 仕様: FR-034 全操作をログに記録
	 * 仕様: FR-045b プレイヤー位置を自動記録（不正検知用）
	 */
	@bindThis
	public async createLog(
		type: NoctownTransactionType,
		playerId: string,
		targetId: string | null,
		amount: number | null,
		beforeState: NoctownTransactionState | null,
		afterState: NoctownTransactionState | null,
		metadata?: Record<string, unknown>,
		targetPlayerId?: string | null,
	): Promise<NoctownTransactionLog> {
		const id = this.idService.gen();
		const createdAt = new Date();

		// 仕様FR-045b: プレイヤー位置をnoctown_playerテーブルから取得（クライアント送信値は信頼しない）
		const player = await this.noctownPlayersRepository.findOneBy({ id: playerId });
		const playerPosition = player ? {
			x: player.positionX ?? 0,
			y: player.positionY ?? 0,
			z: player.positionZ ?? 0,
		} : undefined;

		// 仕様FR-045b: beforeState/afterStateにプレイヤー位置を追加
		const beforeStateWithPosition: NoctownTransactionState | null = beforeState ? {
			...beforeState,
			playerPosition,
		} : null;

		const afterStateWithPosition: NoctownTransactionState | null = afterState ? {
			...afterState,
			playerPosition,
		} : null;

		// 仕様: FR-034 トランザクションログを作成
		// JSONBカラムは as any でキャスト（ModerationLogService.ts と同様のパターン）
		await this.noctownTransactionLogsRepository.insert({
			id,
			playerId,
			type,
			targetId,
			targetPlayerId: targetPlayerId ?? null,
			amount,
			beforeState: (beforeStateWithPosition ?? null) as any,
			afterState: (afterStateWithPosition ?? null) as any,
			metadata: (metadata ?? null) as any,
			isValid: true,
			invalidReason: null,
			createdAt,
		});

		const log = await this.noctownTransactionLogsRepository.findOneByOrFail({ id });
		return log;
	}

	/**
	 * 不正なトランザクションログを記録（操作は拒否）
	 * 仕様: FR-034 不正検知時の対応
	 * 仕様: FR-045b プレイヤー位置を自動記録（不正検知用）
	 */
	@bindThis
	public async createInvalidLog(
		type: NoctownTransactionType,
		playerId: string,
		targetId: string | null,
		reason: string,
		beforeState?: NoctownTransactionState | null,
		metadata?: Record<string, unknown>,
	): Promise<NoctownTransactionLog> {
		const id = this.idService.gen();
		const createdAt = new Date();

		// 仕様FR-045b: プレイヤー位置をnoctown_playerテーブルから取得（クライアント送信値は信頼しない）
		const player = await this.noctownPlayersRepository.findOneBy({ id: playerId });
		const playerPosition = player ? {
			x: player.positionX ?? 0,
			y: player.positionY ?? 0,
			z: player.positionZ ?? 0,
		} : undefined;

		// 仕様FR-045b: beforeStateにプレイヤー位置を追加
		const beforeStateWithPosition: NoctownTransactionState | null = beforeState ? {
			...beforeState,
			playerPosition,
		} : null;

		// 仕様: FR-034 不正なトランザクションログを作成（操作は拒否されるが記録は残す）
		// JSONBカラムは as any でキャスト（ModerationLogService.ts と同様のパターン）
		await this.noctownTransactionLogsRepository.insert({
			id,
			playerId,
			type,
			targetId,
			targetPlayerId: null,
			amount: null,
			beforeState: (beforeStateWithPosition ?? null) as any,
			afterState: null,
			metadata: (metadata ?? null) as any,
			isValid: false,
			invalidReason: reason,
			createdAt,
		});

		const log = await this.noctownTransactionLogsRepository.findOneByOrFail({ id });
		return log;
	}

	/**
	 * 状態遷移の整合性を検証
	 * 仕様: FR-034 beforeState / afterState による状態整合性検証
	 * @returns { valid: boolean, reason?: string }
	 */
	@bindThis
	public verifyStateTransition(
		type: NoctownTransactionType,
		beforeState: NoctownTransactionState | null,
		afterState: NoctownTransactionState | null,
		operatorId: string,
	): { valid: boolean; reason?: string } {
		const rules = stateTransitionRules[type];

		// beforeState が必要なのに存在しない
		if (rules.allowedBeforeStatus && !beforeState) {
			return { valid: false, reason: 'beforeState is required but missing' };
		}

		// beforeState.status のチェック
		if (rules.allowedBeforeStatus && beforeState) {
			if (!rules.allowedBeforeStatus.includes(beforeState.status ?? '')) {
				return {
					valid: false,
					reason: `Invalid beforeState.status: ${beforeState.status}, expected one of: ${rules.allowedBeforeStatus.join(', ')}`,
				};
			}
		}

		// afterState.status のチェック
		if (rules.expectedAfterStatus && afterState) {
			if (afterState.status !== rules.expectedAfterStatus) {
				return {
					valid: false,
					reason: `Invalid afterState.status: ${afterState.status}, expected: ${rules.expectedAfterStatus}`,
				};
			}
		}

		// 所有者チェック
		if (rules.checkOwner && beforeState && beforeState.ownerId !== operatorId) {
			return {
				valid: false,
				reason: `Operator ${operatorId} is not the owner (${beforeState.ownerId})`,
			};
		}

		// 数量の整合性チェック（不正な増減を防止）
		if (beforeState && afterState) {
			if (beforeState.quantity !== undefined && afterState.quantity !== undefined) {
				// ITEM_DROP, ITEM_PICKUP では数量が変わらないはず
				if (['ITEM_DROP', 'ITEM_PICKUP', 'ITEM_PLACE', 'ITEM_RETRIEVE'].includes(type)) {
					if (beforeState.quantity !== afterState.quantity) {
						return {
							valid: false,
							reason: `Quantity mismatch: before=${beforeState.quantity}, after=${afterState.quantity}`,
						};
					}
				}
			}
		}

		return { valid: true };
	}

	/**
	 * レガシーアイテムかどうかを判定
	 * 仕様: FR-034 トランザクションログが0件の場合はレガシーモード
	 */
	@bindThis
	public async isLegacyItem(targetId: string): Promise<boolean> {
		const count = await this.noctownTransactionLogsRepository.countBy({
			targetId,
		});
		return count === 0;
	}

	/**
	 * 特定ターゲットの最新状態を取得
	 * 仕様: FR-034 監査可能性 - 状態遷移の可視化
	 */
	@bindThis
	public async getLatestState(targetId: string): Promise<NoctownTransactionState | null> {
		const latestLog = await this.noctownTransactionLogsRepository.findOne({
			where: { targetId, isValid: true },
			order: { createdAt: 'DESC' },
		});

		return latestLog?.afterState ?? null;
	}

	/**
	 * 数量（amount）のバリデーション
	 * 仕様: FR-034 正の整数のみ許可
	 */
	@bindThis
	public validateAmount(amount: number): { valid: boolean; reason?: string } {
		if (!Number.isInteger(amount)) {
			return { valid: false, reason: 'Amount must be an integer' };
		}
		if (amount < 1) {
			return { valid: false, reason: 'Amount must be positive (>= 1)' };
		}
		return { valid: true };
	}

	/**
	 * インベントリにアイテムが存在するかを確認
	 * 仕様: FR-034 存在しないitemIdでの操作を拒否
	 */
	@bindThis
	public async validateInventoryItemExists(
		playerId: string,
		itemId: string,
	): Promise<{ valid: boolean; reason?: string; item?: unknown }> {
		const item = await this.noctownPlayerItemsRepository.findOneBy({
			playerId,
			itemId,
		});

		if (!item) {
			return { valid: false, reason: `Item ${itemId} not found in player ${playerId}'s inventory` };
		}

		return { valid: true, item };
	}

	/**
	 * ドロップアイテムが存在するかを確認
	 */
	@bindThis
	public async validateDroppedItemExists(
		droppedItemId: string,
	): Promise<{ valid: boolean; reason?: string; item?: unknown }> {
		const item = await this.noctownDroppedItemsRepository.findOneBy({
			id: droppedItemId,
		});

		if (!item) {
			return { valid: false, reason: `Dropped item ${droppedItemId} not found` };
		}

		return { valid: true, item };
	}

	/**
	 * 設置アイテムが存在するかを確認
	 */
	@bindThis
	public async validatePlacedItemExists(
		placedItemId: string,
	): Promise<{ valid: boolean; reason?: string; item?: unknown }> {
		const item = await this.noctownPlacedItemsRepository.findOneBy({
			id: placedItemId,
		});

		if (!item) {
			return { valid: false, reason: `Placed item ${placedItemId} not found` };
		}

		return { valid: true, item };
	}

	/**
	 * 特定ターゲットのトランザクション履歴を取得
	 * 仕様: FR-034 監査可能性 - 完全な履歴追跡
	 */
	@bindThis
	public async getTransactionHistory(
		targetId: string,
		limit = 100,
	): Promise<NoctownTransactionLog[]> {
		return this.noctownTransactionLogsRepository.find({
			where: { targetId },
			order: { createdAt: 'ASC' },
			take: limit,
		});
	}

	/**
	 * 状態遷移チェーンの整合性を検証
	 * 仕様: FR-034 監査可能性 - afterState(n) と beforeState(n+1) が一致するか
	 */
	@bindThis
	public async verifyStateChain(targetId: string): Promise<{
		valid: boolean;
		inconsistencies: Array<{
			logId: string;
			expected: NoctownTransactionState | null;
			actual: NoctownTransactionState | null;
		}>;
	}> {
		const history = await this.getTransactionHistory(targetId);
		const inconsistencies: Array<{
			logId: string;
			expected: NoctownTransactionState | null;
			actual: NoctownTransactionState | null;
		}> = [];

		for (let i = 1; i < history.length; i++) {
			const prevLog = history[i - 1];
			const currentLog = history[i];

			// 前回のafterStateと今回のbeforeStateを比較
			const expectedStatus = prevLog.afterState?.status;
			const actualStatus = currentLog.beforeState?.status;

			if (expectedStatus !== actualStatus) {
				inconsistencies.push({
					logId: currentLog.id,
					expected: prevLog.afterState,
					actual: currentLog.beforeState,
				});
			}
		}

		return {
			valid: inconsistencies.length === 0,
			inconsistencies,
		};
	}

	/**
	 * 不正操作のログを取得
	 * 仕様: FR-034 監査可能性 - 不正操作の検出
	 */
	@bindThis
	public async getInvalidTransactions(
		playerId?: string,
		limit = 100,
	): Promise<NoctownTransactionLog[]> {
		const where: Record<string, unknown> = { isValid: false };
		if (playerId) {
			where.playerId = playerId;
		}

		return this.noctownTransactionLogsRepository.find({
			where,
			order: { createdAt: 'DESC' },
			take: limit,
		});
	}
}
