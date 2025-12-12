/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import type {
	NoctownPlayersRepository,
	NoctownGachasRepository,
} from '@/models/_.js';
import { ApiError } from '@/server/api/error.js';

export const meta = {
	tags: ['noctown'],
	requireCredential: true,
	kind: 'read:account',
	errors: {
		noPlayer: {
			message: 'Player not found.',
			code: 'NO_PLAYER',
			id: 'f2b03a01-0001-0001-0001-000000000001',
		},
	},
	res: {
		type: 'object',
		properties: {
			gachas: {
				type: 'array',
				items: {
					type: 'object',
					properties: {
						id: { type: 'string' },
						name: { type: 'string' },
						description: { type: 'string', nullable: true },
						costPerPull: { type: 'number' },
						gachaType: { type: 'string' },
						isAvailable: { type: 'boolean' },
					},
				},
			},
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {},
	required: [],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject(DI.noctownPlayersRepository)
		private noctownPlayersRepository: NoctownPlayersRepository,
		@Inject(DI.noctownGachasRepository)
		private noctownGachasRepository: NoctownGachasRepository,
	) {
		super(meta, paramDef, async (ps, me) => {
			const player = await this.noctownPlayersRepository.findOneBy({ userId: me.id });
			if (!player) {
				throw new ApiError(meta.errors.noPlayer);
			}

			const now = new Date();
			const gachas = await this.noctownGachasRepository.find({
				where: { isActive: true },
				order: { createdAt: 'DESC' },
			});

			return {
				gachas: gachas.map(gacha => {
					// Check if gacha is available based on dates
					let isAvailable = gacha.isActive;
					if (gacha.startDate && gacha.startDate > now) {
						isAvailable = false;
					}
					if (gacha.endDate && gacha.endDate < now) {
						isAvailable = false;
					}

					return {
						id: gacha.id,
						name: gacha.name,
						description: gacha.description,
						costPerPull: gacha.costPerPull,
						gachaType: gacha.gachaType,
						isAvailable,
					};
				}),
			};
		});
	}
}
