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
	kind: 'read:account',

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'object',
			properties: {
				id: { type: 'string' },
				ownerId: { type: 'string' },
				name: { type: 'string', nullable: true },
				positionX: { type: 'number' },
				positionY: { type: 'number' },
				positionZ: { type: 'number' },
				rotation: { type: 'number' },
				houseType: { type: 'number' },
			},
		},
	},

	errors: {
		playerNotFound: {
			message: 'Player not found.',
			code: 'PLAYER_NOT_FOUND',
			id: 'a1b2c3d4-house-0003-0001-000000000001',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		x: { type: 'number' },
		z: { type: 'number' },
		radius: { type: 'number', default: 50 },
	},
	required: ['x', 'z'],
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

			const houses = await this.noctownService.getNearbyHouses(
				ps.x,
				ps.z,
				ps.radius ?? 50,
			);

			return houses;
		});
	}
}
