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
	NoctownTreasureChestsRepository,
	NoctownShopInventoriesRepository,
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
			id: 'f2b02a04-0001-0001-0001-000000000001',
		},
		noAgent: {
			message: 'Agent not found.',
			code: 'NO_AGENT',
			id: 'f2b02a04-0001-0001-0002-000000000001',
		},
		notOwned: {
			message: 'You do not own this agent.',
			code: 'NOT_OWNED',
			id: 'f2b02a04-0001-0001-0003-000000000001',
		},
		notEquipped: {
			message: 'Agent is not equipped.',
			code: 'NOT_EQUIPPED',
			id: 'f2b02a04-0001-0001-0004-000000000001',
		},
		tooHungry: {
			message: 'Agent is too hungry to give hints.',
			code: 'TOO_HUNGRY',
			id: 'f2b02a04-0001-0001-0005-000000000001',
		},
		cooldown: {
			message: 'Agent needs to rest before giving another hint.',
			code: 'COOLDOWN',
			id: 'f2b02a04-0001-0001-0006-000000000001',
		},
	},
	res: {
		type: 'object',
		properties: {
			hint: {
				type: 'object',
				properties: {
					type: { type: 'string' },
					message: { type: 'string' },
					direction: { type: 'string', nullable: true },
					distance: { type: 'string', nullable: true },
				},
			},
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		agentId: { type: 'string', format: 'misskey:id' },
	},
	required: ['agentId'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject(DI.noctownPlayersRepository)
		private noctownPlayersRepository: NoctownPlayersRepository,
		@Inject(DI.noctownAgentsRepository)
		private noctownAgentsRepository: NoctownAgentsRepository,
		@Inject(DI.noctownTreasureChestsRepository)
		private noctownTreasureChestsRepository: NoctownTreasureChestsRepository,
		@Inject(DI.noctownShopInventoriesRepository)
		private noctownShopInventoriesRepository: NoctownShopInventoriesRepository,
	) {
		super(meta, paramDef, async (ps, me) => {
			const player = await this.noctownPlayersRepository.findOneBy({ userId: me.id });
			if (!player) {
				throw new ApiError(meta.errors.noPlayer);
			}

			const agent = await this.noctownAgentsRepository.findOneBy({ id: ps.agentId });
			if (!agent) {
				throw new ApiError(meta.errors.noAgent);
			}

			if (agent.playerId !== player.id) {
				throw new ApiError(meta.errors.notOwned);
			}

			if (!agent.isEquipped) {
				throw new ApiError(meta.errors.notEquipped);
			}

			if (agent.fullness < 20) {
				throw new ApiError(meta.errors.tooHungry);
			}

			// Check cooldown (5 minutes base, reduced by level)
			const cooldownMs = Math.max(60000, 300000 - agent.level * 30000); // Min 1 minute
			if (agent.lastHintAt && Date.now() - agent.lastHintAt.getTime() < cooldownMs) {
				throw new ApiError(meta.errors.cooldown);
			}

			// Generate hint based on agent level
			const hint = await this.generateHint(player, agent);

			// Update agent
			await this.noctownAgentsRepository.update(
				{ id: ps.agentId },
				{
					lastHintAt: new Date(),
					fullness: Math.max(0, agent.fullness - 5), // Costs some fullness
				},
			);

			return { hint };
		});
	}

	private async generateHint(
		player: { positionX: number; positionZ: number },
		agent: { level: number },
	): Promise<{
		type: string;
		message: string;
		direction: string | null;
		distance: string | null;
	}> {
		// Try to find nearby treasure chests
		// Calculate player's chunk coordinates
		const CHUNK_SIZE = 64;
		const playerChunkX = Math.floor(player.positionX / CHUNK_SIZE);
		const playerChunkZ = Math.floor(player.positionZ / CHUNK_SIZE);

		const nearbyChests = await this.noctownTreasureChestsRepository
			.createQueryBuilder('chest')
			.where('chest.isOpened = false')
			.andWhere('ABS(chest.chunkX - :cx) <= 1', { cx: playerChunkX })
			.andWhere('ABS(chest.chunkZ - :cz) <= 1', { cz: playerChunkZ })
			.orderBy('RANDOM()')
			.take(1)
			.getOne();

		if (nearbyChests) {
			// Calculate world position from chunk and local coordinates
			const chestWorldX = nearbyChests.chunkX * CHUNK_SIZE + nearbyChests.localX;
			const chestWorldZ = nearbyChests.chunkZ * CHUNK_SIZE + nearbyChests.localZ;
			const dx = chestWorldX - player.positionX;
			const dz = chestWorldZ - player.positionZ;
			const distance = Math.sqrt(dx * dx + dz * dz);

			// Calculate direction
			const angle = Math.atan2(dz, dx) * (180 / Math.PI);
			let direction = 'north';
			if (angle >= -22.5 && angle < 22.5) direction = 'east';
			else if (angle >= 22.5 && angle < 67.5) direction = 'southeast';
			else if (angle >= 67.5 && angle < 112.5) direction = 'south';
			else if (angle >= 112.5 && angle < 157.5) direction = 'southwest';
			else if (angle >= 157.5 || angle < -157.5) direction = 'west';
			else if (angle >= -157.5 && angle < -112.5) direction = 'northwest';
			else if (angle >= -112.5 && angle < -67.5) direction = 'north';
			else if (angle >= -67.5 && angle < -22.5) direction = 'northeast';

			// Distance description based on level
			let distanceDesc = 'far away';
			if (agent.level >= 3) {
				if (distance < 10) distanceDesc = 'very close';
				else if (distance < 20) distanceDesc = 'nearby';
				else if (distance < 35) distanceDesc = 'a bit far';
				else distanceDesc = 'far away';
			}

			return {
				type: 'treasure',
				message: `I sense something shiny to the ${direction}!`,
				direction: agent.level >= 2 ? direction : null,
				distance: agent.level >= 3 ? distanceDesc : null,
			};
		}

		// No treasure found, give general hint
		const generalHints = [
			{ type: 'general', message: 'The air feels peaceful here...', direction: null, distance: null },
			{ type: 'general', message: 'I hear water flowing nearby!', direction: null, distance: null },
			{ type: 'general', message: 'There might be something interesting if we explore more.', direction: null, distance: null },
			{ type: 'general', message: 'The forest seems quiet today.', direction: null, distance: null },
			{ type: 'general', message: 'I smell something delicious from the village!', direction: null, distance: null },
		];

		return generalHints[Math.floor(Math.random() * generalHints.length)];
	}
}
