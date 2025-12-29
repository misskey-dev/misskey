/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import type { NoctownPlayerItemsRepository, NoctownItemsRepository, NoctownPlayersRepository } from '@/models/_.js';
import { ApiError } from '@/server/api/error.js';
import { NoctownTransactionService } from '@/core/NoctownTransactionService.js';
import type { NoctownTransactionState } from '@/models/noctown/NoctownTransactionLog.js';

export const meta = {
	tags: ['noctown'],

	requireCredential: true,
	kind: 'write:account',

	res: {
		type: 'object',
		optional: false, nullable: false,
		properties: {
			success: { type: 'boolean' },
			containedItems: {
				type: 'array',
				items: {
					type: 'object',
					properties: {
						itemId: { type: 'string' },
						quantity: { type: 'number' },
					},
				},
			},
		},
	},

	errors: {
		playerNotFound: {
			message: 'Player not found.',
			code: 'PLAYER_NOT_FOUND',
			id: 'container-set-000',
		},
		noSuchContainer: {
			message: 'No such container item.',
			code: 'NO_SUCH_CONTAINER',
			id: 'container-set-001',
		},
		notAContainer: {
			message: 'This item is not a container.',
			code: 'NOT_A_CONTAINER',
			id: 'container-set-002',
		},
		containerNotEmpty: {
			message: 'Container already has items.',
			code: 'CONTAINER_NOT_EMPTY',
			id: 'container-set-003',
		},
		noSuchItem: {
			message: 'No such item to set.',
			code: 'NO_SUCH_ITEM',
			id: 'container-set-004',
		},
		insufficientQuantity: {
			message: 'Insufficient item quantity.',
			code: 'INSUFFICIENT_QUANTITY',
			id: 'container-set-005',
		},
		exceedsCapacity: {
			message: 'Exceeds container capacity.',
			code: 'EXCEEDS_CAPACITY',
			id: 'container-set-006',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		// 仕様: コンテナ（宝箱）のプレイヤーアイテムID
		containerPlayerItemId: { type: 'string' },
		// 仕様: セットするアイテムのリスト
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
			maxItems: 16,
		},
	},
	required: ['containerPlayerItemId', 'items'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.noctownPlayerItemsRepository)
		private playerItemsRepository: NoctownPlayerItemsRepository,

		@Inject(DI.noctownItemsRepository)
		private itemsRepository: NoctownItemsRepository,

		@Inject(DI.noctownPlayersRepository)
		private playersRepository: NoctownPlayersRepository,

		private noctownTransactionService: NoctownTransactionService,
	) {
		super(meta, paramDef, async (ps, me) => {
			// 仕様: プレイヤーを取得
			const player = await this.playersRepository.findOneBy({ userId: me.id });
			if (!player) {
				throw new ApiError(meta.errors.playerNotFound);
			}

			// 仕様: コンテナアイテムを取得
			const containerPlayerItem = await this.playerItemsRepository.findOne({
				where: { id: ps.containerPlayerItemId },
				relations: ['item'],
			});

			if (!containerPlayerItem) {
				throw new ApiError(meta.errors.noSuchContainer);
			}

			// 仕様: 自分のアイテムかチェック
			if (containerPlayerItem.playerId !== player.id) {
				throw new ApiError(meta.errors.noSuchContainer);
			}

			// 仕様: コンテナタイプかチェック
			const containerItem = await this.itemsRepository.findOneBy({ id: containerPlayerItem.itemId });
			if (!containerItem || containerItem.itemType !== 'container') {
				throw new ApiError(meta.errors.notAContainer);
			}

			// 仕様: 既に中身があるかチェック（空の宝箱のみセット可能）
			if (containerPlayerItem.containedItems && containerPlayerItem.containedItems.length > 0) {
				throw new ApiError(meta.errors.containerNotEmpty);
			}

			// 仕様: 容量チェック
			const capacity = containerItem.containerCapacity ?? 16;
			if (ps.items.length > capacity) {
				throw new ApiError(meta.errors.exceedsCapacity);
			}

			// 仕様: セットするアイテムを検証
			const containedItems: Array<{ itemId: string; quantity: number }> = [];
			const itemsToDeduct: Array<{ playerItem: typeof containerPlayerItem; quantity: number }> = [];

			for (const itemToSet of ps.items) {
				const playerItem = await this.playerItemsRepository.findOne({
					where: { id: itemToSet.playerItemId },
				});

				if (!playerItem) {
					throw new ApiError(meta.errors.noSuchItem);
				}

				// 仕様: 自分のアイテムかチェック
				if (playerItem.playerId !== player.id) {
					throw new ApiError(meta.errors.noSuchItem);
				}

				// 仕様: 数量チェック
				if (playerItem.quantity < itemToSet.quantity) {
					throw new ApiError(meta.errors.insufficientQuantity);
				}

				// 仕様: コンテナ自身をセットすることはできない
				if (playerItem.id === ps.containerPlayerItemId) {
					throw new ApiError(meta.errors.noSuchItem);
				}

				containedItems.push({
					itemId: playerItem.itemId,
					quantity: itemToSet.quantity,
				});

				itemsToDeduct.push({
					playerItem,
					quantity: itemToSet.quantity,
				});
			}

			// 仕様: beforeState を記録（不正防止のため操作前の状態を保存）
			const beforeState: NoctownTransactionState = {
				status: 'active',
				ownerId: player.id,
				quantity: containerPlayerItem.quantity,
				location: 'inventory',
				containedItems: containerPlayerItem.containedItems ?? [],
			};

			// 仕様: afterState を記録（操作後の状態）
			const afterState: NoctownTransactionState = {
				status: 'active',
				ownerId: player.id,
				quantity: containerPlayerItem.quantity,
				location: 'inventory',
				containedItems,
			};

			// 仕様: 状態遷移の検証（不正防止）
			const transitionCheck = this.noctownTransactionService.verifyStateTransition(
				'CONTAINER_SET',
				beforeState,
				afterState,
				player.id,
			);

			if (!transitionCheck.valid) {
				// 仕様: 不正な操作を記録して拒否
				await this.noctownTransactionService.createInvalidLog(
					'CONTAINER_SET',
					player.id,
					containerPlayerItem.itemId,
					transitionCheck.reason ?? 'Invalid state transition',
					beforeState,
					{ containerPlayerItemId: ps.containerPlayerItemId, containedItems },
				);
				throw new ApiError(meta.errors.noSuchContainer);
			}

			// 仕様: トランザクションログを記録（beforeState/afterState付き）
			await this.noctownTransactionService.createLog(
				'CONTAINER_SET',
				player.id,
				containerPlayerItem.itemId,
				containedItems.length,
				beforeState,
				afterState,
				{
					containerPlayerItemId: ps.containerPlayerItemId,
					containedItems,
					itemsDeducted: itemsToDeduct.map(i => ({ playerItemId: i.playerItem.id, quantity: i.quantity })),
				},
			);

			// 仕様: アイテムをコンテナにセット
			await this.playerItemsRepository.update(
				{ id: ps.containerPlayerItemId },
				{ containedItems },
			);

			// 仕様: セットしたアイテムをインベントリから減らす
			for (const { playerItem, quantity } of itemsToDeduct) {
				if (playerItem.quantity === quantity) {
					// 仕様: 数量が同じなら削除
					await this.playerItemsRepository.delete({ id: playerItem.id });
				} else {
					// 仕様: 数量を減らす
					await this.playerItemsRepository.update(
						{ id: playerItem.id },
						{ quantity: playerItem.quantity - quantity },
					);
				}
			}

			return {
				success: true,
				containedItems,
			};
		});
	}
}
