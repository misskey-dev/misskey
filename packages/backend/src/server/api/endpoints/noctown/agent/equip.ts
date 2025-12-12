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
} from '@/models/_.js';
import { ApiError } from '@/server/api/error.js';

export const meta = {
	tags: ['noctown'],
	requireCredential: true,
	kind: 'write:account',
	errors: {
		noPlayer: {
			message: 'Player not found.',
			code: 'NO_PLAYER',
			id: 'f2b02a01-0001-0001-0001-000000000001',
		},
		noAgent: {
			message: 'Agent not found.',
			code: 'NO_AGENT',
			id: 'f2b02a01-0001-0001-0002-000000000001',
		},
		notOwned: {
			message: 'You do not own this agent.',
			code: 'NOT_OWNED',
			id: 'f2b02a01-0001-0001-0003-000000000001',
		},
	},
	res: {
		type: 'object',
		properties: {
			success: { type: 'boolean' },
			equippedAgentId: { type: 'string', nullable: true },
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		agentId: { type: 'string', format: 'misskey:id' },
	},
	required: [],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject(DI.noctownPlayersRepository)
		private noctownPlayersRepository: NoctownPlayersRepository,
		@Inject(DI.noctownAgentsRepository)
		private noctownAgentsRepository: NoctownAgentsRepository,
	) {
		super(meta, paramDef, async (ps, me) => {
			const player = await this.noctownPlayersRepository.findOneBy({ userId: me.id });
			if (!player) {
				throw new ApiError(meta.errors.noPlayer);
			}

			// If no agentId provided, unequip current agent
			if (!ps.agentId) {
				// Unequip all agents
				await this.noctownAgentsRepository.update(
					{ playerId: player.id, isEquipped: true },
					{ isEquipped: false },
				);

				// Update player
				await this.noctownPlayersRepository.update(
					{ id: player.id },
					{ equippedAgentId: null },
				);

				return {
					success: true,
					equippedAgentId: null,
				};
			}

			// Find the agent
			const agent = await this.noctownAgentsRepository.findOneBy({ id: ps.agentId });
			if (!agent) {
				throw new ApiError(meta.errors.noAgent);
			}

			if (agent.playerId !== player.id) {
				throw new ApiError(meta.errors.notOwned);
			}

			// Unequip all other agents
			await this.noctownAgentsRepository.update(
				{ playerId: player.id, isEquipped: true },
				{ isEquipped: false },
			);

			// Equip this agent
			await this.noctownAgentsRepository.update(
				{ id: ps.agentId },
				{ isEquipped: true },
			);

			// Update player
			await this.noctownPlayersRepository.update(
				{ id: player.id },
				{ equippedAgentId: ps.agentId },
			);

			return {
				success: true,
				equippedAgentId: ps.agentId,
			};
		});
	}
}
