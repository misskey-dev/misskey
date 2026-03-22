/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import { NoctownService } from '@/core/NoctownService.js';
import type { NoctownPlayersRepository, UsersRepository } from '@/models/_.js';

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
				playerId: { type: 'string' },
				username: { type: 'string' },
				avatarUrl: { type: 'string', nullable: true },
				positionX: { type: 'number' },
				positionY: { type: 'number' },
				positionZ: { type: 'number' },
			},
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		x: { type: 'number' },
		z: { type: 'number' },
		radius: { type: 'number', default: 30 },
	},
	required: ['x', 'z'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.noctownPlayersRepository)
		private noctownPlayersRepository: NoctownPlayersRepository,

		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		private noctownService: NoctownService,
	) {
		super(meta, paramDef, async (ps) => {
			const radius = Math.min(ps.radius ?? 30, 50);

			const npcs = await this.noctownService.getNearbyNpcs(ps.x, ps.z, radius);

			const results = await Promise.all(npcs.map(async (npc) => {
				const player = await this.noctownPlayersRepository.findOneBy({ id: npc.playerId });
				let username = 'Unknown';
				let avatarUrl: string | null = null;

				if (player) {
					const user = await this.usersRepository.findOneBy({ id: player.userId });
					if (user) {
						username = user.username;
						avatarUrl = user.avatarUrl;
					}
				}

				return {
					id: npc.id,
					playerId: npc.playerId,
					username,
					avatarUrl,
					positionX: npc.positionX,
					positionY: npc.positionY,
					positionZ: npc.positionZ,
				};
			}));

			return results;
		});
	}
}
