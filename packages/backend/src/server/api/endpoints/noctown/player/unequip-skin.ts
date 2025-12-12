/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
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
		},
	},

	errors: {
		playerNotFound: {
			message: 'Player not found.',
			code: 'PLAYER_NOT_FOUND',
			id: 'b1c2d3e4-0015-0002-0001-000000000001',
		},
		noSkinEquipped: {
			message: 'No skin is currently equipped.',
			code: 'NO_SKIN_EQUIPPED',
			id: 'b1c2d3e4-0015-0002-0001-000000000002',
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

		private globalEventService: GlobalEventService,
	) {
		super(meta, paramDef, async (ps, me) => {
			// Get player
			const player = await this.noctownPlayersRepository.findOneBy({ userId: me.id });
			if (!player) {
				throw new ApiError(meta.errors.playerNotFound);
			}

			// Check if skin is equipped
			if (!player.equippedSkinId) {
				throw new ApiError(meta.errors.noSkinEquipped);
			}

			// Unequip the skin
			await this.noctownPlayersRepository.update(
				{ id: player.id },
				{ equippedSkinId: null },
			);

			// Broadcast skin change to other players
			this.globalEventService.publishNoctownStream('playerSkinChanged', {
				playerId: player.id,
				userId: me.id,
				skinId: null,
				skinName: null,
				skinData: null,
			});

			return {
				success: true,
			};
		});
	}
}
