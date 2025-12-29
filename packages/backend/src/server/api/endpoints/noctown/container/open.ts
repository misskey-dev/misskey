/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import type { NoctownPlayerItemsRepository, NoctownItemsRepository, NoctownPlayersRepository, NoctownWalletsRepository } from '@/models/_.js';
import { ApiError } from '@/server/api/error.js';
import { IdService } from '@/core/IdService.js';
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
			// 仕様: 開封して手に入れたアイテム一覧
			obtainedItems: {
				type: 'array',
				items: {
					type: 'object',
					properties: {
						itemId: { type: 'string' },
						itemName: { type: 'string' },
						quantity: { type: 'number' },
						rarity: { type: 'number' },
						emoji: { type: 'string', nullable: true },
					},
				},
			},
		},
	},

	errors: {
		playerNotFound: {
			message: 'Player not found.',
			code: 'PLAYER_NOT_FOUND',
			id: 'container-open-000',
		},
		walletNotFound: {
			message: 'Wallet not found.',
			code: 'WALLET_NOT_FOUND',
			id: 'container-open-004',
		},
		noSuchContainer: {
			message: 'No such container item.',
			code: 'NO_SUCH_CONTAINER',
			id: 'container-open-001',
		},
		notAContainer: {
			message: 'This item is not a container.',
			code: 'NOT_A_CONTAINER',
			id: 'container-open-002',
		},
		containerEmpty: {
			message: 'Container is empty.',
			code: 'CONTAINER_EMPTY',
			id: 'container-open-003',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		// 仕様: コンテナ（宝箱）のプレイヤーアイテムID
		containerPlayerItemId: { type: 'string' },
	},
	required: ['containerPlayerItemId'],
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

		@Inject(DI.noctownWalletsRepository)
		private walletsRepository: NoctownWalletsRepository,

		private idService: IdService,

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

			// 仕様: 中身があるかチェック
			const containedItems = containerPlayerItem.containedItems;
			if (!containedItems || containedItems.length === 0) {
				throw new ApiError(meta.errors.containerEmpty);
			}

			// 仕様FR-112a: ノクタコインのアイテムID（ウォレットに直接加算する）
			const NOCTACOIN_ITEM_ID = 'ageaa86mvg9c001z';

			// 仕様: 中身のアイテム情報を取得
			const obtainedItems: Array<{
				itemId: string;
				itemName: string;
				quantity: number;
				rarity: number;
				emoji: string | null;
			}> = [];

			for (const contained of containedItems) {
				const item = await this.itemsRepository.findOneBy({ id: contained.itemId });
				if (item) {
					obtainedItems.push({
						itemId: item.id,
						itemName: item.name,
						quantity: contained.quantity,
						rarity: item.rarity,
						emoji: item.emoji,
					});

					// 仕様FR-112a: ノクタコインの場合はウォレットに直接加算
					if (contained.itemId === NOCTACOIN_ITEM_ID) {
						const wallet = await this.walletsRepository.findOneBy({ playerId: player.id });
						if (!wallet) {
							throw new ApiError(meta.errors.walletNotFound);
						}
						const newBalance = BigInt(wallet.balance) + BigInt(contained.quantity);
						await this.walletsRepository.update(
							{ id: wallet.id },
							{ balance: newBalance.toString() },
						);
					} else {
						// 仕様: 通常アイテムはインベントリに追加
						const existingPlayerItem = await this.playerItemsRepository.findOne({
							where: {
								playerId: player.id,
								itemId: contained.itemId,
							},
						});

						if (existingPlayerItem) {
							// 仕様: 既存アイテムの数量を増やす
							await this.playerItemsRepository.update(
								{ id: existingPlayerItem.id },
								{ quantity: existingPlayerItem.quantity + contained.quantity },
							);
						} else {
							// 仕様: 新規アイテムとして追加
							await this.playerItemsRepository.insert({
								id: this.idService.gen(),
								playerId: player.id,
								itemId: contained.itemId,
								quantity: contained.quantity,
								acquiredAt: new Date(),
								version: 1,
								containedItems: null,
							});
						}
					}
				}
			}

			// 仕様: beforeState を記録（不正防止のため操作前の状態を保存）
			const beforeState: NoctownTransactionState = {
				status: 'active',
				ownerId: player.id,
				quantity: containerPlayerItem.quantity,
				location: 'inventory',
				containedItems: containedItems,
			};

			// 仕様: afterState を記録（コンテナは開封されて消滅）
			const afterState: NoctownTransactionState = {
				status: 'opened',
				ownerId: player.id,
				quantity: 0,
				location: 'inventory',
				containedItems: [],
			};

			// 仕様: 状態遷移の検証（不正防止）
			const transitionCheck = this.noctownTransactionService.verifyStateTransition(
				'CONTAINER_OPEN',
				beforeState,
				afterState,
				player.id,
			);

			if (!transitionCheck.valid) {
				// 仕様: 不正な操作を記録して拒否
				await this.noctownTransactionService.createInvalidLog(
					'CONTAINER_OPEN',
					player.id,
					containerPlayerItem.itemId,
					transitionCheck.reason ?? 'Invalid state transition',
					beforeState,
					{ containerPlayerItemId: ps.containerPlayerItemId },
				);
				throw new ApiError(meta.errors.noSuchContainer);
			}

			// 仕様: トランザクションログを記録（beforeState/afterState付き）
			await this.noctownTransactionService.createLog(
				'CONTAINER_OPEN',
				player.id,
				containerPlayerItem.itemId,
				1,
				beforeState,
				afterState,
				{
					containerPlayerItemId: ps.containerPlayerItemId,
					containedItems,
					obtainedItems,
				},
			);

			// 仕様: 宝箱を削除（消滅）
			await this.playerItemsRepository.delete({ id: ps.containerPlayerItemId });

			return {
				success: true,
				obtainedItems,
			};
		});
	}
}
