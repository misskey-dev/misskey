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
			houseId: { type: 'string', nullable: true },
		},
	},

	errors: {
		playerNotFound: {
			message: 'Player not found.',
			code: 'PLAYER_NOT_FOUND',
			id: 'a1b2c3d4-house-0001-0001-000000000001',
		},
		maxHousesReached: {
			message: 'Maximum houses limit reached.',
			code: 'MAX_HOUSES_REACHED',
			id: 'a1b2c3d4-house-0001-0001-000000000002',
		},
		houseItemNotFound: {
			message: 'House item not found in inventory.',
			code: 'HOUSE_ITEM_NOT_FOUND',
			id: 'a1b2c3d4-house-0001-0001-000000000003',
		},
		invalidHouseItem: {
			message: 'The item is not a valid house item.',
			code: 'INVALID_HOUSE_ITEM',
			id: 'a1b2c3d4-house-0001-0001-000000000004',
		},
		locationOccupied: {
			message: 'The location is already occupied by another house.',
			code: 'LOCATION_OCCUPIED',
			id: 'a1b2c3d4-house-0001-0001-000000000005',
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
		name: { type: 'string', maxLength: 64, nullable: true },
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

			const result = await this.noctownService.placeHouse(
				player.id,
				ps.playerItemId,
				ps.x,
				ps.y,
				ps.z,
				ps.rotation ?? 0,
				ps.name ?? undefined,
			);

			if (!result.success) {
				switch (result.error) {
					case 'MAX_HOUSES_REACHED':
						throw new ApiError(meta.errors.maxHousesReached);
					case 'HOUSE_ITEM_NOT_FOUND':
						throw new ApiError(meta.errors.houseItemNotFound);
					case 'INVALID_HOUSE_ITEM':
						throw new ApiError(meta.errors.invalidHouseItem);
					case 'LOCATION_OCCUPIED':
						throw new ApiError(meta.errors.locationOccupied);
					default:
						throw new ApiError(meta.errors.houseItemNotFound);
				}
			}

			return {
				success: true,
				houseId: result.houseId ?? null,
			};
		});
	}
}
