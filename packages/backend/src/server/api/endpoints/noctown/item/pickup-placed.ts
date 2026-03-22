/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/**
 * FR-032: 設置アイテム回収API
 * 自分が設置したアイテムをインベントリに回収する
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import { IdService } from '@/core/IdService.js';
import type { NoctownPlayersRepository, NoctownPlacedItemsRepository, NoctownPlayerItemsRepository } from '@/models/_.js';
import { ApiError } from '@/server/api/error.js';

export const meta = {
	tags: ['noctown'],

	requireCredential: true,
	kind: 'write:account',

	errors: {
		noSuchPlacedItem: {
			message: 'No such placed item.',
			code: 'NO_SUCH_PLACED_ITEM',
			id: 'f032-0001-0000-0000-000000000001',
		},
		notYourItem: {
			message: 'This item was not placed by you.',
			code: 'NOT_YOUR_ITEM',
			id: 'f032-0001-0000-0000-000000000002',
		},
		noSuchPlayer: {
			message: 'Player not found.',
			code: 'NO_SUCH_PLAYER',
			id: 'f032-0001-0000-0000-000000000003',
		},
	},

	res: {
		type: 'object',
		optional: false, nullable: false,
		properties: {
			success: { type: 'boolean' },
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
	) {
		super(meta, paramDef, async (ps, me) => {
			// Get player
			const player = await this.noctownPlayersRepository.findOneBy({ userId: me.id });
			if (!player) {
				throw new ApiError(meta.errors.noSuchPlayer);
			}

			// Get placed item
			const placedItem = await this.noctownPlacedItemsRepository.findOneBy({ id: ps.placedItemId });
			if (!placedItem) {
				throw new ApiError(meta.errors.noSuchPlacedItem);
			}

			// Check ownership
			if (placedItem.playerId !== player.id) {
				throw new ApiError(meta.errors.notYourItem);
			}

			// Check if player already has this item in inventory
			const existingItem = await this.noctownPlayerItemsRepository.findOneBy({
				playerId: player.id,
				itemId: placedItem.itemId,
			});

			if (existingItem) {
				// Increase quantity
				await this.noctownPlayerItemsRepository.update(existingItem.id, {
					quantity: existingItem.quantity + 1,
				});
			} else {
				// Create new inventory entry
				await this.noctownPlayerItemsRepository.insert({
					id: this.idService.gen(),
					playerId: player.id,
					itemId: placedItem.itemId,
					quantity: 1,
					acquiredAt: new Date(),
				});
			}

			// Remove placed item
			await this.noctownPlacedItemsRepository.delete(placedItem.id);

			return { success: true };
		});
	}
}
