/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import { ShopNpcService } from '@/misc/noctown/shop-npc-service.js';
import type { NoctownPlayersRepository } from '@/models/_.js';
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
			newBalance: { type: 'string', nullable: true },
		},
	},

	errors: {
		playerNotFound: {
			message: 'Player not found.',
			code: 'PLAYER_NOT_FOUND',
			id: 'c1d2e3f4-0010-0001-0001-000000000001',
		},
		itemNotFound: {
			message: 'Item not found in shop.',
			code: 'ITEM_NOT_FOUND',
			id: 'c1d2e3f4-0010-0001-0001-000000000002',
		},
		itemNotAvailable: {
			message: 'Item is not available.',
			code: 'ITEM_NOT_AVAILABLE',
			id: 'c1d2e3f4-0010-0001-0001-000000000003',
		},
		insufficientStock: {
			message: 'Insufficient stock.',
			code: 'INSUFFICIENT_STOCK',
			id: 'c1d2e3f4-0010-0001-0001-000000000004',
		},
		insufficientFunds: {
			message: 'Insufficient funds.',
			code: 'INSUFFICIENT_FUNDS',
			id: 'c1d2e3f4-0010-0001-0001-000000000005',
		},
		walletNotFound: {
			message: 'Wallet not found.',
			code: 'WALLET_NOT_FOUND',
			id: 'c1d2e3f4-0010-0001-0001-000000000006',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		interiorId: { type: 'string' },
		inventoryItemId: { type: 'string' },
		quantity: { type: 'integer', minimum: 1, default: 1 },
	},
	required: ['interiorId', 'inventoryItemId'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.noctownPlayersRepository)
		private noctownPlayersRepository: NoctownPlayersRepository,

		private shopNpcService: ShopNpcService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const player = await this.noctownPlayersRepository.findOneBy({ userId: me.id });
			if (!player) {
				throw new ApiError(meta.errors.playerNotFound);
			}

			const result = await this.shopNpcService.buyItem(
				player.id,
				ps.interiorId,
				ps.inventoryItemId,
				ps.quantity,
			);

			if (!result.success) {
				switch (result.error) {
					case 'ITEM_NOT_FOUND':
						throw new ApiError(meta.errors.itemNotFound);
					case 'ITEM_NOT_AVAILABLE':
						throw new ApiError(meta.errors.itemNotAvailable);
					case 'INSUFFICIENT_STOCK':
						throw new ApiError(meta.errors.insufficientStock);
					case 'INSUFFICIENT_FUNDS':
						throw new ApiError(meta.errors.insufficientFunds);
					case 'WALLET_NOT_FOUND':
						throw new ApiError(meta.errors.walletNotFound);
				}
			}

			return {
				success: true,
				newBalance: result.newBalance ?? null,
			};
		});
	}
}
