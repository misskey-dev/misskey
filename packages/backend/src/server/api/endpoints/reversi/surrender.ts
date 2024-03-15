/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { ReversiService } from '@/core/ReversiService.js';
import { ApiError } from '../../error.js';

export const meta = {
	requireCredential: true,

	kind: 'write:account',

	errors: {
		noSuchGame: {
			message: 'No such game.',
			code: 'NO_SUCH_GAME',
			id: 'ace0b11f-e0a6-4076-a30d-e8284c81b2df',
		},

		alreadyEnded: {
			message: 'That game has already ended.',
			code: 'ALREADY_ENDED',
			id: '6c2ad4a6-cbf1-4a5b-b187-b772826cfc6d',
		},

		accessDenied: {
			message: 'Access denied.',
			code: 'ACCESS_DENIED',
			id: '6e04164b-a992-4c93-8489-2123069973e1',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		gameId: { type: 'string', format: 'misskey:id' },
	},
	required: ['gameId'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		private reversiService: ReversiService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const game = await this.reversiService.get(ps.gameId);

			if (game == null) {
				throw new ApiError(meta.errors.noSuchGame);
			}

			if (game.isEnded) {
				throw new ApiError(meta.errors.alreadyEnded);
			}

			if ((game.user1Id !== me.id) && (game.user2Id !== me.id)) {
				throw new ApiError(meta.errors.accessDenied);
			}

			await this.reversiService.surrender(game.id, me);
		});
	}
}
