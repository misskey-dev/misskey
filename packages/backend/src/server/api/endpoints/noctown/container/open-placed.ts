/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import type { NoctownPlayerItemsRepository, NoctownPlacedItemsRepository, NoctownItemsRepository, NoctownPlayersRepository, NoctownWalletsRepository } from '@/models/_.js';
import { ApiError } from '@/server/api/error.js';
import { IdService } from '@/core/IdService.js';
import { NoctownTransactionService } from '@/core/NoctownTransactionService.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import type { NoctownTransactionState } from '@/models/noctown/NoctownTransactionLog.js';

// 仕様: 地面に設置された宝箱を直接開けるAPI
// マップ上で宝箱をタップして「開ける」を選択した際に呼び出される
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
			id: 'container-open-placed-000',
		},
		walletNotFound: {
			message: 'Wallet not found.',
			code: 'WALLET_NOT_FOUND',
			id: 'container-open-placed-004',
		},
		noSuchPlacedItem: {
			message: 'No such placed item.',
			code: 'NO_SUCH_PLACED_ITEM',
			id: 'container-open-placed-001',
		},
		notAContainer: {
			message: 'This item is not a container.',
			code: 'NOT_A_CONTAINER',
			id: 'container-open-placed-002',
		},
		containerEmpty: {
			message: 'Container is empty.',
			code: 'CONTAINER_EMPTY',
			id: 'container-open-placed-003',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		// 仕様: 設置された宝箱のplacedItemId
		placedItemId: { type: 'string' },
	},
	required: ['placedItemId'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.noctownPlacedItemsRepository)
		private placedItemsRepository: NoctownPlacedItemsRepository,

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

		private globalEventService: GlobalEventService,
	) {
		super(meta, paramDef, async (ps, me) => {
			// 仕様: プレイヤーを取得
			const player = await this.playersRepository.findOneBy({ userId: me.id });
			if (!player) {
				throw new ApiError(meta.errors.playerNotFound);
			}

			// 仕様: 設置アイテムを取得
			const placedItem = await this.placedItemsRepository.findOne({
				where: { id: ps.placedItemId },
			});

			if (!placedItem) {
				throw new ApiError(meta.errors.noSuchPlacedItem);
			}

			// 仕様: コンテナタイプかチェック
			const containerItem = await this.itemsRepository.findOneBy({ id: placedItem.itemId });
			if (!containerItem || containerItem.itemType !== 'container') {
				throw new ApiError(meta.errors.notAContainer);
			}

			// 仕様: 中身があるかチェック
			const containedItems = placedItem.containedItems;
			if (!containedItems || containedItems.length === 0) {
				throw new ApiError(meta.errors.containerEmpty);
			}

			// 仕様FR-107a: ノクタコインのアイテムID（ウォレットに直接加算する）
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

					// 仕様FR-107a: ノクタコインの場合はウォレットに直接加算
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
			// playerIdがnullの場合はundefinedとして扱う
			const beforeState: NoctownTransactionState = {
				status: 'placed',
				ownerId: placedItem.playerId ?? undefined,
				quantity: 1,
				location: 'map',
				containedItems: containedItems,
				positionX: placedItem.positionX,
				positionY: placedItem.positionY,
				positionZ: placedItem.positionZ,
			};

			// 仕様: afterState を記録（設置コンテナは開封されて消滅）
			const afterState: NoctownTransactionState = {
				status: 'opened',
				ownerId: placedItem.playerId ?? undefined,
				quantity: 0,
				location: 'map',
				containedItems: [],
			};

			// 仕様: トランザクションログを記録（beforeState/afterState付き）
			// 設置された宝箱は誰でも開けられるため、開封者（player.id）と設置者（placedItem.playerId）を両方記録
			await this.noctownTransactionService.createLog(
				'CONTAINER_OPEN',
				player.id,
				placedItem.itemId,
				1,
				beforeState,
				afterState,
				{
					placedItemId: ps.placedItemId,
					placedByPlayerId: placedItem.playerId,
					containedItems,
					obtainedItems,
					openedFromMap: true,
				},
				placedItem.playerId, // targetPlayerId: 設置者を記録
			);

			// 仕様: 設置された宝箱を削除（消滅）
			await this.placedItemsRepository.delete({ id: ps.placedItemId });

			// 仕様FR-123〜FR-126: 周囲プレイヤーにcontainerOpenedイベントをブロードキャスト
			// 開封者以外のプレイヤーがアニメーション再生＆削除できるようにする
			this.globalEventService.publishNoctownStream('containerOpened', {
				placedItemId: ps.placedItemId,
				openedByPlayerId: player.id,
				positionX: placedItem.positionX,
				positionY: placedItem.positionY,
				positionZ: placedItem.positionZ,
			});

			return {
				success: true,
				obtainedItems,
			};
		});
	}
}
