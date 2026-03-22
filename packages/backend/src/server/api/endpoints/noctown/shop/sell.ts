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
			soldPrice: { type: 'integer', nullable: true },
		},
	},

	errors: {
		playerNotFound: {
			message: 'Player not found.',
			code: 'PLAYER_NOT_FOUND',
			id: 'c1d2e3f4-0010-0002-0001-000000000001',
		},
		itemNotFound: {
			message: 'Item not found in inventory.',
			code: 'ITEM_NOT_FOUND',
			id: 'c1d2e3f4-0010-0002-0001-000000000002',
		},
		insufficientQuantity: {
			message: 'Insufficient quantity.',
			code: 'INSUFFICIENT_QUANTITY',
			id: 'c1d2e3f4-0010-0002-0001-000000000003',
		},
		itemNotSellable: {
			message: 'This item cannot be sold.',
			code: 'ITEM_NOT_SELLABLE',
			id: 'c1d2e3f4-0010-0002-0001-000000000004',
		},
		walletNotFound: {
			message: 'Wallet not found.',
			code: 'WALLET_NOT_FOUND',
			id: 'c1d2e3f4-0010-0002-0001-000000000005',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		interiorId: { type: 'string' },
		playerItemId: { type: 'string' },
		quantity: { type: 'integer', minimum: 1, default: 1 },
	},
	required: ['interiorId', 'playerItemId'],
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

			const result = await this.shopNpcService.sellItem(
				player.id,
				ps.interiorId,
				ps.playerItemId,
				ps.quantity,
			);

			if (!result.success) {
				switch (result.error) {
					case 'ITEM_NOT_FOUND':
						throw new ApiError(meta.errors.itemNotFound);
					case 'INSUFFICIENT_QUANTITY':
						throw new ApiError(meta.errors.insufficientQuantity);
					case 'ITEM_NOT_SELLABLE':
						throw new ApiError(meta.errors.itemNotSellable);
					case 'WALLET_NOT_FOUND':
						throw new ApiError(meta.errors.walletNotFound);
				}
			}

			return {
				success: true,
				newBalance: result.newBalance ?? null,
				soldPrice: result.soldPrice ?? null,
			};
		});
	}
}
