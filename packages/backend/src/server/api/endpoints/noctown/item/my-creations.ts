/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import type {
	NoctownItemsRepository,
	NoctownPlayersRepository,
} from '@/models/_.js';
import { ApiError } from '@/server/api/error.js';

export const meta = {
	tags: ['noctown'],
	requireCredential: true,
	kind: 'read:account',

	res: {
		type: 'object',
		properties: {
			items: {
				type: 'array',
				items: {
					type: 'object',
					properties: {
						id: { type: 'string' },
						name: { type: 'string' },
						flavorText: { type: 'string', nullable: true },
						itemType: { type: 'string' },
						imageUrl: { type: 'string', nullable: true },
						createdAt: { type: 'string' },
					},
				},
			},
			total: { type: 'number' },
			maxAllowed: { type: 'number' },
		},
	},

	errors: {
		playerNotFound: {
			message: 'Player not found.',
			code: 'PLAYER_NOT_FOUND',
			id: 'c1d2e3f4-0019-0001-0001-000000000001',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 30 },
		offset: { type: 'integer', minimum: 0, default: 0 },
	},
	required: [],
} as const;

const MAX_PLAYER_ITEMS = 50;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject(DI.noctownItemsRepository)
		private noctownItemsRepository: NoctownItemsRepository,

		@Inject(DI.noctownPlayersRepository)
		private noctownPlayersRepository: NoctownPlayersRepository,
	) {
		super(meta, paramDef, async (ps, me) => {
			// Get player
			const player = await this.noctownPlayersRepository.findOneBy({ userId: me.id });
			if (!player) {
				throw new ApiError(meta.errors.playerNotFound);
			}

			// Get player-created items
			const [items, total] = await this.noctownItemsRepository.findAndCount({
				where: { creatorId: me.id, isPlayerCreated: true },
				order: { createdAt: 'DESC' },
				take: ps.limit ?? 30,
				skip: ps.offset ?? 0,
			});

			return {
				items: items.map(item => ({
					id: item.id,
					name: item.name,
					flavorText: item.flavorText,
					itemType: item.itemType,
					imageUrl: item.imageUrl,
					fullImageUrl: item.fullImageUrl,
					rarity: item.rarity,
					isUnique: item.isUnique,
					createdAt: item.createdAt.toISOString(),
				})),
				total,
				maxAllowed: MAX_PLAYER_ITEMS,
			};
		});
	}
}
