/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import type {
	NoctownPlayersRepository,
	NoctownPlayerItemsRepository,
	NoctownItemsRepository,
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
			equippedSkinId: { type: 'string', nullable: true },
			skinName: { type: 'string', nullable: true },
		},
	},

	errors: {
		playerNotFound: {
			message: 'Player not found.',
			code: 'PLAYER_NOT_FOUND',
			id: 'b1c2d3e4-0015-0001-0001-000000000001',
		},
		itemNotFound: {
			message: 'Item not found in inventory.',
			code: 'ITEM_NOT_FOUND',
			id: 'b1c2d3e4-0015-0001-0001-000000000002',
		},
		notSkinItem: {
			message: 'This item is not a skin.',
			code: 'NOT_SKIN_ITEM',
			id: 'b1c2d3e4-0015-0001-0001-000000000003',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		playerItemId: { type: 'string' },
	},
	required: ['playerItemId'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.noctownPlayersRepository)
		private noctownPlayersRepository: NoctownPlayersRepository,

		@Inject(DI.noctownPlayerItemsRepository)
		private noctownPlayerItemsRepository: NoctownPlayerItemsRepository,

		@Inject(DI.noctownItemsRepository)
		private noctownItemsRepository: NoctownItemsRepository,

		private globalEventService: GlobalEventService,
	) {
		super(meta, paramDef, async (ps, me) => {
			// Get player
			const player = await this.noctownPlayersRepository.findOneBy({ userId: me.id });
			if (!player) {
				throw new ApiError(meta.errors.playerNotFound);
			}

			// Get player item
			const playerItem = await this.noctownPlayerItemsRepository.findOne({
				where: {
					id: ps.playerItemId,
					playerId: player.id,
				},
				relations: ['item'],
			});

			if (!playerItem) {
				throw new ApiError(meta.errors.itemNotFound);
			}

			// Check if item is a skin type
			const item = await this.noctownItemsRepository.findOneBy({ id: playerItem.itemId });
			if (!item || item.itemType !== 'skin') {
				throw new ApiError(meta.errors.notSkinItem);
			}

			// Equip the skin
			await this.noctownPlayersRepository.update(
				{ id: player.id },
				{ equippedSkinId: item.id },
			);

			// Broadcast skin change to other players
			this.globalEventService.publishNoctownStream('playerSkinChanged', {
				playerId: player.id,
				userId: me.id,
				skinId: item.id,
				skinName: item.name,
				skinData: item.imageUrl, // Use imageUrl as skin data
			});

			return {
				success: true,
				equippedSkinId: item.id,
				skinName: item.name,
			};
		});
	}
}
