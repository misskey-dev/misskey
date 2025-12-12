/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import type {
	NoctownPlayersRepository,
	NoctownHousesRepository,
	NoctownHouseFurnituresRepository,
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
		},
	},

	errors: {
		playerNotFound: {
			message: 'Player not found.',
			code: 'PLAYER_NOT_FOUND',
			id: 'a1b2c3d4-furn-0003-0001-000000000001',
		},
		houseNotFound: {
			message: 'House not found or not owned by player.',
			code: 'HOUSE_NOT_FOUND',
			id: 'a1b2c3d4-furn-0003-0001-000000000002',
		},
		furnitureNotFound: {
			message: 'Furniture not found.',
			code: 'FURNITURE_NOT_FOUND',
			id: 'a1b2c3d4-furn-0003-0001-000000000003',
		},
		invalidPosition: {
			message: 'Invalid position (outside interior bounds).',
			code: 'INVALID_POSITION',
			id: 'a1b2c3d4-furn-0003-0001-000000000004',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		houseId: { type: 'string' },
		furnitureId: { type: 'string' },
		x: { type: 'number' },
		z: { type: 'number' },
		rotation: { type: 'number', nullable: true },
	},
	required: ['houseId', 'furnitureId', 'x', 'z'],
} as const;

const INTERIOR_MAX_X = 8;
const INTERIOR_MAX_Z = 8;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.noctownPlayersRepository)
		private noctownPlayersRepository: NoctownPlayersRepository,

		@Inject(DI.noctownHousesRepository)
		private noctownHousesRepository: NoctownHousesRepository,

		@Inject(DI.noctownHouseFurnituresRepository)
		private noctownHouseFurnituresRepository: NoctownHouseFurnituresRepository,
	) {
		super(meta, paramDef, async (ps, me) => {
			const player = await this.noctownPlayersRepository.findOneBy({ userId: me.id });
			if (!player) {
				throw new ApiError(meta.errors.playerNotFound);
			}

			// Verify house ownership
			const house = await this.noctownHousesRepository.findOneBy({
				id: ps.houseId,
				ownerId: player.id,
			});
			if (!house) {
				throw new ApiError(meta.errors.houseNotFound);
			}

			// Validate position (within interior bounds)
			if (ps.x < 1 || ps.x >= INTERIOR_MAX_X - 1 || ps.z < 1 || ps.z >= INTERIOR_MAX_Z - 1) {
				throw new ApiError(meta.errors.invalidPosition);
			}

			// Get the furniture
			const furniture = await this.noctownHouseFurnituresRepository.findOneBy({
				id: ps.furnitureId,
				houseId: ps.houseId,
			});
			if (!furniture) {
				throw new ApiError(meta.errors.furnitureNotFound);
			}

			// Update position
			await this.noctownHouseFurnituresRepository.update(furniture.id, {
				positionX: ps.x,
				positionZ: ps.z,
				...(ps.rotation != null ? { rotation: ps.rotation } : {}),
			});

			return { success: true };
		});
	}
}
