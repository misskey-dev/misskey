/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import type {
	NoctownPlayersRepository,
	NoctownAgentsRepository,
	NoctownItemsRepository,
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
			id: 'f2b02a02-0001-0001-0001-000000000001',
		},
	},
	res: {
		type: 'object',
		properties: {
			agents: {
				type: 'array',
				items: {
					type: 'object',
					properties: {
						id: { type: 'string' },
						itemId: { type: 'string' },
						itemName: { type: 'string' },
						nickname: { type: 'string', nullable: true },
						fullness: { type: 'number' },
						happiness: { type: 'number' },
						level: { type: 'number' },
						experience: { type: 'number' },
						isEquipped: { type: 'boolean' },
						createdAt: { type: 'string' },
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
		@Inject(DI.noctownAgentsRepository)
		private noctownAgentsRepository: NoctownAgentsRepository,
		@Inject(DI.noctownItemsRepository)
		private noctownItemsRepository: NoctownItemsRepository,
	) {
		super(meta, paramDef, async (ps, me) => {
			const player = await this.noctownPlayersRepository.findOneBy({ userId: me.id });
			if (!player) {
				throw new ApiError(meta.errors.noPlayer);
			}

			const agents = await this.noctownAgentsRepository.find({
				where: { playerId: player.id },
				order: { createdAt: 'DESC' },
			});

			// Get item info
			const itemIds = [...new Set(agents.map(a => a.itemId))];
			const items = await this.noctownItemsRepository.find({
				where: itemIds.map(id => ({ id })),
			});
			const itemMap = new Map(items.map(i => [i.id, i]));

			return {
				agents: agents.map(agent => {
					const item = itemMap.get(agent.itemId);
					return {
						id: agent.id,
						itemId: agent.itemId,
						itemName: item?.name ?? 'Unknown',
						nickname: agent.nickname,
						fullness: agent.fullness,
						happiness: agent.happiness,
						level: agent.level,
						experience: agent.experience,
						isEquipped: agent.isEquipped,
						createdAt: agent.createdAt.toISOString(),
					};
				}),
			};
		});
	}
}
