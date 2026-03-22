/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import { NoctownService } from '@/core/NoctownService.js';
import type { NoctownPlayersRepository, NoctownHousesRepository } from '@/models/_.js';
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
			exitPosition: {
				type: 'object',
				properties: {
					x: { type: 'number' },
					y: { type: 'number' },
					z: { type: 'number' },
				},
			},
		},
	},

	errors: {
		playerNotFound: {
			message: 'Player not found.',
			code: 'PLAYER_NOT_FOUND',
			id: 'a1b2c3d4-house-0007-0001-000000000001',
		},
		houseNotFound: {
			message: 'House not found.',
			code: 'HOUSE_NOT_FOUND',
			id: 'a1b2c3d4-house-0007-0001-000000000002',
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

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.noctownPlayersRepository)
		private noctownPlayersRepository: NoctownPlayersRepository,

		@Inject(DI.noctownHousesRepository)
		private noctownHousesRepository: NoctownHousesRepository,

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

			// Calculate exit position (in front of the house door)
			const exitX = house.positionX + Math.sin(house.rotation * Math.PI / 180) * 3;
			const exitZ = house.positionZ + Math.cos(house.rotation * Math.PI / 180) * 3;

			// Update player position
			await this.noctownPlayersRepository.update(player.id, {
				positionX: exitX,
				positionY: house.positionY,
				positionZ: exitZ,
				lastActiveAt: new Date(),
			});

			return {
				success: true,
				exitPosition: {
					x: exitX,
					y: house.positionY,
					z: exitZ,
				},
			};
		});
	}
}
