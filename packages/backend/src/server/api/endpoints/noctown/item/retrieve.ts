/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import { IdService } from '@/core/IdService.js';
import { NoctownTransactionService } from '@/core/NoctownTransactionService.js';
import type { NoctownTransactionState } from '@/models/noctown/NoctownTransactionLog.js';
import type {
	NoctownPlayersRepository,
	NoctownPlacedItemsRepository,
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
			playerItemId: { type: 'string', nullable: true },
		},
	},

	errors: {
		playerNotFound: {
			message: 'Player not found.',
			code: 'PLAYER_NOT_FOUND',
			id: 'a1b2c3d4-0002-0002-0001-000000000001',
		},
		placedItemNotFound: {
			message: 'Placed item not found.',
			code: 'PLACED_ITEM_NOT_FOUND',
			id: 'a1b2c3d4-0002-0002-0001-000000000002',
		},
		notOwner: {
			message: 'You are not the owner of this item.',
			code: 'NOT_OWNER',
			id: 'a1b2c3d4-0002-0002-0001-000000000003',
		},
		tooFar: {
			message: 'You are too far from the item.',
			code: 'TOO_FAR',
			id: 'a1b2c3d4-0002-0002-0001-000000000004',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		placedItemId: { type: 'string' },
	},
	required: ['placedItemId'],
} as const;

const RETRIEVE_DISTANCE = 5.0; // Maximum distance to retrieve item

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.noctownPlayersRepository)
		private noctownPlayersRepository: NoctownPlayersRepository,

		@Inject(DI.noctownPlacedItemsRepository)
		private noctownPlacedItemsRepository: NoctownPlacedItemsRepository,

		@Inject(DI.noctownPlayerItemsRepository)
		private noctownPlayerItemsRepository: NoctownPlayerItemsRepository,

		private idService: IdService,
		private noctownTransactionService: NoctownTransactionService,
	) {
		super(meta, paramDef, async (ps, me) => {
			// Get player
			const player = await this.noctownPlayersRepository.findOneBy({ userId: me.id });
			if (!player) {
				throw new ApiError(meta.errors.playerNotFound);
			}

			// Get placed item
			const placedItem = await this.noctownPlacedItemsRepository.findOne({
				where: { id: ps.placedItemId },
				relations: ['item'],
			});

			if (!placedItem) {
				throw new ApiError(meta.errors.placedItemNotFound);
			}

			// Check ownership
			if (placedItem.playerId !== player.id) {
				throw new ApiError(meta.errors.notOwner);
			}

			// Check distance
			const dx = player.positionX - placedItem.positionX;
			const dy = player.positionY - placedItem.positionY;
			const dz = player.positionZ - placedItem.positionZ;
			const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

			if (distance > RETRIEVE_DISTANCE) {
				throw new ApiError(meta.errors.tooFar);
			}

			// 仕様: FR-034 beforeState を記録
			const beforeState: NoctownTransactionState = {
				location: 'map',
				status: 'placed',
				ownerId: player.id,
				quantity: 1,
				version: placedItem.version,
				positionX: placedItem.positionX,
				positionY: placedItem.positionY,
				positionZ: placedItem.positionZ,
			};

			// Return item to inventory
			const existingPlayerItem = await this.noctownPlayerItemsRepository.findOneBy({
				playerId: player.id,
				itemId: placedItem.itemId,
			});

			let playerItemId: string;

			if (existingPlayerItem) {
				// Add to existing stack
				await this.noctownPlayerItemsRepository.update(
					{ id: existingPlayerItem.id },
					{ quantity: existingPlayerItem.quantity + 1 },
				);
				playerItemId = existingPlayerItem.id;
			} else {
				// Create new inventory entry
				playerItemId = this.idService.gen();
				await this.noctownPlayerItemsRepository.insert({
					id: playerItemId,
					playerId: player.id,
					itemId: placedItem.itemId,
					quantity: 1,
				});
			}

			// Remove placed item
			await this.noctownPlacedItemsRepository.delete({ id: ps.placedItemId });

			// 仕様: FR-034 afterState を記録しトランザクションログを作成
			const afterState: NoctownTransactionState = {
				location: 'inventory',
				status: 'retrieved',
				ownerId: player.id,
				quantity: 1,
			};

			await this.noctownTransactionService.createLog(
				'ITEM_RETRIEVE',
				player.id,
				ps.placedItemId,
				1,
				beforeState,
				afterState,
				{ itemId: placedItem.itemId, playerItemId },
			);

			return {
				success: true,
				playerItemId,
			};
		});
	}
}
