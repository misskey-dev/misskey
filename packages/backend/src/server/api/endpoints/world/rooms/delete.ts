/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import { WorldRoomService } from '@/core/WorldRoomService.js';
import { ApiError } from '@/server/api/error.js';

export const meta = {
	tags: ['worldRoom'],

	requireCredential: true,

	kind: 'write:worldRoom',

	errors: {
		noSuchRoom: {
			message: 'No such room.',
			code: 'NO_SUCH_ROOM',
			id: 'd4e3753d-97bf-4a19-ab8e-21080fbc0f4c',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		roomId: { type: 'string', format: 'misskey:id' },
	},
	required: ['roomId'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		private worldRoomService: WorldRoomService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const room = await this.worldRoomService.findMyRoomById(me.id, ps.roomId);
			if (room == null) {
				throw new ApiError(meta.errors.noSuchRoom);
			}

			await this.worldRoomService.delete(room, me);
		});
	}
}
