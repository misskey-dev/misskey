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
	NoctownPlayerItemsRepository,
	NoctownItemsRepository,
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
			id: 'f2b02a03-0001-0001-0001-000000000001',
		},
		noAgent: {
			message: 'Agent not found.',
			code: 'NO_AGENT',
			id: 'f2b02a03-0001-0001-0002-000000000001',
		},
		notOwned: {
			message: 'You do not own this agent.',
			code: 'NOT_OWNED',
			id: 'f2b02a03-0001-0001-0003-000000000001',
		},
		noFeedItem: {
			message: 'Feed item not found in inventory.',
			code: 'NO_FEED_ITEM',
			id: 'f2b02a03-0001-0001-0004-000000000001',
		},
		notFeedable: {
			message: 'This item cannot be used as feed.',
			code: 'NOT_FEEDABLE',
			id: 'f2b02a03-0001-0001-0005-000000000001',
		},
		alreadyFull: {
			message: 'Agent is already full.',
			code: 'ALREADY_FULL',
			id: 'f2b02a03-0001-0001-0006-000000000001',
		},
	},
	res: {
		type: 'object',
		properties: {
			success: { type: 'boolean' },
			fullness: { type: 'number' },
			happiness: { type: 'number' },
			experienceGained: { type: 'number' },
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		agentId: { type: 'string', format: 'misskey:id' },
		playerItemId: { type: 'string', format: 'misskey:id' },
	},
	required: ['agentId', 'playerItemId'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject(DI.noctownPlayersRepository)
		private noctownPlayersRepository: NoctownPlayersRepository,
		@Inject(DI.noctownAgentsRepository)
		private noctownAgentsRepository: NoctownAgentsRepository,
		@Inject(DI.noctownPlayerItemsRepository)
		private noctownPlayerItemsRepository: NoctownPlayerItemsRepository,
		@Inject(DI.noctownItemsRepository)
		private noctownItemsRepository: NoctownItemsRepository,
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

			// Check feed item
			const playerItem = await this.noctownPlayerItemsRepository.findOne({
				where: { id: ps.playerItemId, playerId: player.id },
			});
			if (!playerItem) {
				throw new ApiError(meta.errors.noFeedItem);
			}

			const item = await this.noctownItemsRepository.findOneBy({ id: playerItem.itemId });
			if (!item || item.itemType !== 'feed') {
				throw new ApiError(meta.errors.notFeedable);
			}

			if (agent.fullness >= 100) {
				throw new ApiError(meta.errors.alreadyFull);
			}

			// Calculate feed effect (based on item value or default)
			const feedValue = item.shopPrice ? Math.min(30, Math.floor(item.shopPrice / 10)) : 20;
			const happinessGain = Math.floor(feedValue / 2);
			const expGain = Math.floor(feedValue / 4);

			const newFullness = Math.min(100, agent.fullness + feedValue);
			const newHappiness = Math.min(100, agent.happiness + happinessGain);
			const newExp = agent.experience + expGain;

			// Check for level up
			const expForNextLevel = agent.level * 100;
			let newLevel = agent.level;
			let remainingExp = newExp;

			while (remainingExp >= newLevel * 100) {
				remainingExp -= newLevel * 100;
				newLevel++;
			}

			// Update agent
			await this.noctownAgentsRepository.update(
				{ id: ps.agentId },
				{
					fullness: newFullness,
					happiness: newHappiness,
					level: newLevel,
					experience: remainingExp,
					lastFedAt: new Date(),
				},
			);

			// Consume feed item
			if (playerItem.quantity > 1) {
				await this.noctownPlayerItemsRepository.update(
					{ id: ps.playerItemId },
					{ quantity: playerItem.quantity - 1 },
				);
			} else {
				await this.noctownPlayerItemsRepository.delete({ id: ps.playerItemId });
			}

			return {
				success: true,
				fullness: newFullness,
				happiness: newHappiness,
				experienceGained: expGain,
			};
		});
	}
}
