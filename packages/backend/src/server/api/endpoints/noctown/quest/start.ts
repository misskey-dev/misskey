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
			questId: { type: 'string', nullable: true },
		},
	},

	errors: {
		playerNotFound: {
			message: 'Player not found.',
			code: 'PLAYER_NOT_FOUND',
			id: 'b1c2d3e4-0002-0002-0001-000000000001',
		},
		npcNotFound: {
			message: 'NPC not found.',
			code: 'NPC_NOT_FOUND',
			id: 'b1c2d3e4-0002-0002-0001-000000000002',
		},
		maxQuestsReached: {
			message: 'Maximum active quests reached.',
			code: 'MAX_QUESTS_REACHED',
			id: 'b1c2d3e4-0002-0002-0001-000000000003',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		npcId: { type: 'string' },
	},
	required: ['npcId'],
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

			const result = await this.noctownService.startQuest(player.id, ps.npcId);

			if (!result.success) {
				if (result.error === 'NPC_NOT_FOUND') {
					throw new ApiError(meta.errors.npcNotFound);
				}
				if (result.error === 'MAX_QUESTS_REACHED') {
					throw new ApiError(meta.errors.maxQuestsReached);
				}
			}

			return {
				success: result.success,
				questId: result.questId ?? null,
			};
		});
	}
}
