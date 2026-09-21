/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import * as v from 'valibot';
import * as mi from '@/misc/schema/index.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { ReversiService } from '@/core/ReversiService.js';
import { ReversiGameEntityService } from '@/core/entities/ReversiGameEntityService.js';
import { packedReversiGameDetailedSchema } from '@/models/schema/reversi-game.js';
import { ApiError } from '../../error.js';

export const meta = {
	errors: {
		noSuchGame: {
			message: 'No such game.',
			code: 'NO_SUCH_GAME',
			id: '8fb05624-b525-43dd-90f7-511852bdfeee',
		},
	},

	res: v.object({
		desynced: v.boolean(),
		game: v.optional(v.nullable(packedReversiGameDetailedSchema)),
	}),
} as const;

export const paramDef = v.object({
	gameId: mi.misskeyId(),
	crc32: v.string(),
});

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		private reversiService: ReversiService,
		private reversiGameEntityService: ReversiGameEntityService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const game = await this.reversiService.checkCrc(ps.gameId, ps.crc32);
			if (game) {
				return {
					desynced: true,
					game: await this.reversiGameEntityService.packDetail(game),
				};
			} else {
				return {
					desynced: false,
				};
			}
		});
	}
}
