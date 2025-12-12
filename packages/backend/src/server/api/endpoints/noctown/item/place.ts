/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import { NoctownService } from '@/core/NoctownService.js';
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
			placedItemId: { type: 'string', nullable: true },
		},
	},

	errors: {
		playerNotFound: {
			message: 'Player not found.',
			code: 'PLAYER_NOT_FOUND',
			id: 'a1b2c3d4-0002-0001-0001-000000000001',
		},
		itemNotOwned: {
			message: 'Item not owned or not placeable.',
			code: 'ITEM_NOT_OWNED',
			id: 'a1b2c3d4-0002-0001-0001-000000000002',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		playerItemId: { type: 'string' },
		x: { type: 'number' },
		y: { type: 'number' },
		z: { type: 'number' },
		rotation: { type: 'number', default: 0 },
	},
	required: ['playerItemId', 'x', 'y', 'z'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.noctownPlayersRepository)
		private noctownPlayersRepository: NoctownPlayersRepository,

		private noctownService: NoctownService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const player = await this.noctownPlayersRepository.findOneBy({ userId: me.id });
			if (!player) {
				throw new ApiError(meta.errors.playerNotFound);
			}

			const success = await this.noctownService.placeItem(
				player.id,
				ps.playerItemId,
				ps.x,
				ps.y,
				ps.z,
				ps.rotation ?? 0,
			);

			if (!success) {
				throw new ApiError(meta.errors.itemNotOwned);
			}

			return {
				success: true,
				placedItemId: null,
			};
		});
	}
}
