/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import { NoctownService } from '@/core/NoctownService.js';
import type { NoctownPlayersRepository, NoctownItemsRepository, NoctownNpcsRepository, UsersRepository } from '@/models/_.js';
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
				questType: { type: 'string' },
				difficulty: { type: 'number' },
				status: { type: 'string' },
				targetItemId: { type: 'string', nullable: true },
				targetItemName: { type: 'string', nullable: true },
				targetCondition: { type: 'object', nullable: true },
				sourceNpcId: { type: 'string' },
				sourceNpcName: { type: 'string', nullable: true },
				destinationNpcId: { type: 'string', nullable: true },
				destinationNpcName: { type: 'string', nullable: true },
				rewardCoins: { type: 'number' },
				rewardItemId: { type: 'string', nullable: true },
				rewardItemName: { type: 'string', nullable: true },
				startedAt: { type: 'string', format: 'date-time' },
			},
		},
	},

	errors: {
		playerNotFound: {
			message: 'Player not found.',
			code: 'PLAYER_NOT_FOUND',
			id: 'b1c2d3e4-0002-0001-0001-000000000001',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {},
	required: [],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.noctownPlayersRepository)
		private noctownPlayersRepository: NoctownPlayersRepository,

		@Inject(DI.noctownItemsRepository)
		private noctownItemsRepository: NoctownItemsRepository,

		@Inject(DI.noctownNpcsRepository)
		private noctownNpcsRepository: NoctownNpcsRepository,

		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		private noctownService: NoctownService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const player = await this.noctownPlayersRepository.findOneBy({ userId: me.id });
			if (!player) {
				throw new ApiError(meta.errors.playerNotFound);
			}

			const quests = await this.noctownService.getActiveQuests(player.id);

			// Enrich with item names and NPC names
			const results = await Promise.all(quests.map(async (quest) => {
				let targetItemName: string | null = null;
				let sourceNpcName: string | null = null;
				let destinationNpcName: string | null = null;
				let rewardItemName: string | null = null;

				if (quest.targetItemId) {
					const item = await this.noctownItemsRepository.findOneBy({ id: quest.targetItemId });
					targetItemName = item?.name ?? null;
				}

				if (quest.rewardItemId) {
					const item = await this.noctownItemsRepository.findOneBy({ id: quest.rewardItemId });
					rewardItemName = item?.name ?? null;
				}

				// Get source NPC name via player -> user
				const sourceNpc = await this.noctownNpcsRepository.findOne({
					where: { id: quest.sourceNpcId },
					relations: ['player'],
				});
				if (sourceNpc?.player) {
					const user = await this.usersRepository.findOneBy({ id: sourceNpc.player.userId });
					sourceNpcName = user?.username ?? null;
				}

				// Get destination NPC name for deliver quests
				if (quest.destinationNpcId) {
					const destNpc = await this.noctownNpcsRepository.findOne({
						where: { id: quest.destinationNpcId },
						relations: ['player'],
					});
					if (destNpc?.player) {
						const user = await this.usersRepository.findOneBy({ id: destNpc.player.userId });
						destinationNpcName = user?.username ?? null;
					}
				}

				return {
					id: quest.id,
					questType: quest.questType,
					difficulty: quest.difficulty,
					status: quest.status,
					targetItemId: quest.targetItemId,
					targetItemName,
					targetCondition: quest.targetCondition,
					sourceNpcId: quest.sourceNpcId,
					sourceNpcName,
					destinationNpcId: quest.destinationNpcId,
					destinationNpcName,
					rewardCoins: quest.rewardCoins,
					rewardItemId: quest.rewardItemId,
					rewardItemName,
					startedAt: quest.startedAt.toISOString(),
				};
			}));

			return results;
		});
	}
}
