/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import { WorldRoomService } from '@/core/WorldRoomService.js';
import { ApiError } from '@/server/api/error.js';
import { WorldRoomEntityService } from '@/core/entities/WorldRoomEntityService.js';

export const meta = {
	tags: ['worldRoom'],

	requireCredential: true,

	kind: 'read:worldRoom',

	res: {
		type: 'object',
		optional: false, nullable: false,
		ref: 'WorldRoomDetailed',
	},

	errors: {
		noSuchRoom: {
			message: 'No such room.',
			code: 'NO_SUCH_ROOM',
			id: '857ae02f-8759-4d20-9adb-6e95fffe4fd8',
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
		private worldRoomEntityService: WorldRoomEntityService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const room = await this.worldRoomService.findRoomById(ps.roomId);
			if (room == null) {
				throw new ApiError(meta.errors.noSuchRoom);
			}

			if (room.userId !== me.id && room.visibility === 'private') {
				throw new ApiError(meta.errors.noSuchRoom);
			}

			return this.worldRoomEntityService.packDetailed(room, me);
		});
	}
}
