/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import type {
	NoctownItemsRepository,
	NoctownPlayerItemsRepository,
	NoctownPlayersRepository,
} from '@/models/_.js';
import { ApiError } from '@/server/api/error.js';

export const meta = {
	tags: ['noctown'],

	requireCredential: true,
	kind: 'read:account',

	res: {
		type: 'object',
		optional: false, nullable: false,
		properties: {
			id: { type: 'string' },
			name: { type: 'string' },
			flavorText: { type: 'string', nullable: true },
			itemType: { type: 'string' },
			rarity: { type: 'number' },
			rarityName: { type: 'string' },
			isUnique: { type: 'boolean' },
			isPlayerCreated: { type: 'boolean' },
			shopPrice: { type: 'number', nullable: true },
			shopSellPrice: { type: 'number', nullable: true },
			imageUrl: { type: 'string', nullable: true },
			fullImageUrl: { type: 'string', nullable: true },
			ownedQuantity: { type: 'number', nullable: true },
		},
	},

	errors: {
		playerNotFound: {
			message: 'Player not found.',
			code: 'PLAYER_NOT_FOUND',
			id: 'c1d2e3f4-0017-0001-0001-000000000001',
		},
		itemNotFound: {
			message: 'Item not found.',
			code: 'ITEM_NOT_FOUND',
			id: 'c1d2e3f4-0017-0001-0001-000000000002',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		itemId: { type: 'string' },
		playerItemId: { type: 'string' },
	},
	anyOf: [
		{ required: ['itemId'] },
		{ required: ['playerItemId'] },
	],
} as const;

// Rarity name mapping
const rarityNames: Record<number, string> = {
	1: 'Common',
	2: 'Uncommon',
	3: 'Rare',
	4: 'Epic',
	5: 'Legendary',
};

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.noctownItemsRepository)
		private noctownItemsRepository: NoctownItemsRepository,

		@Inject(DI.noctownPlayerItemsRepository)
		private noctownPlayerItemsRepository: NoctownPlayerItemsRepository,

		@Inject(DI.noctownPlayersRepository)
		private noctownPlayersRepository: NoctownPlayersRepository,
	) {
		super(meta, paramDef, async (ps, me) => {
			// Get player
			const player = await this.noctownPlayersRepository.findOneBy({ userId: me.id });
			if (!player) {
				throw new ApiError(meta.errors.playerNotFound);
			}

			let item;
			let ownedQuantity: number | null = null;

			if (ps.playerItemId) {
				// Get item from player's inventory
				const playerItem = await this.noctownPlayerItemsRepository.findOne({
					where: { id: ps.playerItemId, playerId: player.id },
				});

				if (!playerItem) {
					throw new ApiError(meta.errors.itemNotFound);
				}

				item = await this.noctownItemsRepository.findOneBy({ id: playerItem.itemId });
				ownedQuantity = playerItem.quantity;
			} else if (ps.itemId) {
				// Get item directly by ID
				item = await this.noctownItemsRepository.findOneBy({ id: ps.itemId });

				// Check if player owns this item
				const playerItem = await this.noctownPlayerItemsRepository.findOne({
					where: { playerId: player.id, itemId: ps.itemId },
				});
				if (playerItem) {
					ownedQuantity = playerItem.quantity;
				}
			}

			if (!item) {
				throw new ApiError(meta.errors.itemNotFound);
			}

			return {
				id: item.id,
				name: item.name,
				flavorText: item.flavorText,
				itemType: item.itemType,
				rarity: item.rarity,
				rarityName: rarityNames[item.rarity] ?? 'Unknown',
				isUnique: item.isUnique,
				isPlayerCreated: item.isPlayerCreated,
				shopPrice: item.shopPrice,
				shopSellPrice: item.shopSellPrice,
				imageUrl: item.imageUrl,
				fullImageUrl: item.fullImageUrl,
				ownedQuantity,
			};
		});
	}
}
