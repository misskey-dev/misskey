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
	kind: 'write:account',

	res: {
		type: 'object',
		optional: false, nullable: false,
		properties: {
			success: { type: 'boolean' },
			rewardCoins: { type: 'number', nullable: true },
		},
	},

	errors: {
		playerNotFound: {
			message: 'Player not found.',
			code: 'PLAYER_NOT_FOUND',
			id: 'b1c2d3e4-0002-0003-0001-000000000001',
		},
		questNotFound: {
			message: 'Quest not found.',
			code: 'QUEST_NOT_FOUND',
			id: 'b1c2d3e4-0002-0003-0001-000000000002',
		},
		itemRequired: {
			message: 'Item is required to complete this quest.',
			code: 'ITEM_REQUIRED',
			id: 'b1c2d3e4-0002-0003-0001-000000000003',
		},
		wrongItem: {
			message: 'Wrong item submitted.',
			code: 'WRONG_ITEM',
			id: 'b1c2d3e4-0002-0003-0001-000000000004',
		},
		conditionNotMet: {
			message: 'Item does not meet quest condition.',
			code: 'CONDITION_NOT_MET',
			id: 'b1c2d3e4-0002-0003-0001-000000000005',
		},
		wrongNpc: {
			message: 'You must talk to the destination NPC to complete this delivery quest.',
			code: 'WRONG_NPC',
			id: 'b1c2d3e4-0002-0003-0001-000000000006',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		questId: { type: 'string' },
		playerItemId: { type: 'string' },
		npcId: { type: 'string' },
	},
	required: ['questId'],
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

			const result = await this.noctownService.completeQuest(
				player.id,
				ps.questId,
				ps.playerItemId,
				ps.npcId,
			);

			if (!result.success) {
				switch (result.error) {
					case 'QUEST_NOT_FOUND':
						throw new ApiError(meta.errors.questNotFound);
					case 'ITEM_REQUIRED':
						throw new ApiError(meta.errors.itemRequired);
					case 'WRONG_ITEM':
						throw new ApiError(meta.errors.wrongItem);
					case 'CONDITION_NOT_MET':
					case 'ITEM_NOT_FOUND':
						throw new ApiError(meta.errors.conditionNotMet);
					case 'WRONG_NPC':
						throw new ApiError(meta.errors.wrongNpc);
				}
			}

			return {
				success: result.success,
				rewardCoins: result.rewardCoins ?? null,
			};
		});
	}
}
