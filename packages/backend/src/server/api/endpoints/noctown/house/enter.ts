/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import { NoctownService } from '@/core/NoctownService.js';
import type { NoctownPlayersRepository, NoctownHousesRepository, NoctownInteriorMapsRepository } from '@/models/_.js';
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
			interior: {
				type: 'object',
				nullable: true,
				properties: {
					id: { type: 'string' },
					name: { type: 'string' },
					width: { type: 'number' },
					depth: { type: 'number' },
					entryX: { type: 'number' },
					entryZ: { type: 'number' },
					tiles: {
						type: 'array',
						items: {
							type: 'array',
							items: {
								type: 'object',
								properties: {
									type: { type: 'string' },
									variant: { type: 'number' },
								},
							},
						},
					},
					furniture: {
						type: 'array',
						items: {
							type: 'object',
							properties: {
								id: { type: 'string' },
								itemId: { type: 'string' },
								positionX: { type: 'number' },
								positionZ: { type: 'number' },
								rotation: { type: 'number' },
							},
						},
					},
				},
			},
			isOwner: { type: 'boolean' },
		},
	},

	errors: {
		playerNotFound: {
			message: 'Player not found.',
			code: 'PLAYER_NOT_FOUND',
			id: 'a1b2c3d4-house-0006-0001-000000000001',
		},
		houseNotFound: {
			message: 'House not found.',
			code: 'HOUSE_NOT_FOUND',
			id: 'a1b2c3d4-house-0006-0001-000000000002',
		},
		tooFarFromHouse: {
			message: 'Too far from the house to enter.',
			code: 'TOO_FAR_FROM_HOUSE',
			id: 'a1b2c3d4-house-0006-0001-000000000003',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		houseId: { type: 'string' },
	},
	required: ['houseId'],
} as const;

// Default house interior template
const DEFAULT_HOUSE_INTERIOR = {
	width: 8,
	depth: 8,
	entryX: 4,
	entryZ: 7,
	tiles: Array(8).fill(null).map((_, x) =>
		Array(8).fill(null).map((_, z) => {
			// Walls on edges
			if (x === 0 || x === 7 || z === 0 || z === 7) {
				// Door at entry
				if (x === 4 && z === 7) {
					return { type: 'door' as const, variant: 0 };
				}
				return { type: 'wall' as const, variant: 0 };
			}
			return { type: 'floor' as const, variant: 0 };
		}),
	),
	furniture: [],
};

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.noctownPlayersRepository)
		private noctownPlayersRepository: NoctownPlayersRepository,

		@Inject(DI.noctownHousesRepository)
		private noctownHousesRepository: NoctownHousesRepository,

		@Inject(DI.noctownInteriorMapsRepository)
		private noctownInteriorMapsRepository: NoctownInteriorMapsRepository,

		private noctownService: NoctownService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const player = await this.noctownPlayersRepository.findOneBy({ userId: me.id });
			if (!player) {
				throw new ApiError(meta.errors.playerNotFound);
			}

			// Find the house
			const house = await this.noctownHousesRepository.findOneBy({ id: ps.houseId });
			if (!house) {
				throw new ApiError(meta.errors.houseNotFound);
			}

			// Check distance (must be within 5 units to enter)
			const distance = Math.sqrt(
				Math.pow(player.positionX - house.positionX, 2) +
				Math.pow(player.positionZ - house.positionZ, 2),
			);
			if (distance > 8) {
				throw new ApiError(meta.errors.tooFarFromHouse);
			}

			// Check if custom interior exists for this house
			const interior = await this.noctownInteriorMapsRepository.findOneBy({
				interiorId: `house_${house.id}`,
			});

			// If no custom interior, use default template
			const interiorData = interior ? {
				id: interior.id,
				name: interior.name,
				width: interior.width,
				depth: interior.depth,
				entryX: interior.entryX,
				entryZ: interior.entryZ,
				tiles: interior.tiles,
				furniture: interior.furniture,
			} : {
				id: `default_${house.id}`,
				name: house.name ?? 'マイホーム',
				...DEFAULT_HOUSE_INTERIOR,
			};

			// Update player state (mark as inside house)
			// Note: For now we just return the interior data
			// In a full implementation, player position tracking would switch to interior mode

			return {
				success: true,
				interior: interiorData,
				isOwner: house.ownerId === player.id,
			};
		});
	}
}
