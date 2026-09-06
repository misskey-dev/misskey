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

	res: {
	},

	errors: {
		noSuchRoom: {
			message: 'No such room.',
			code: 'NO_SUCH_ROOM',
			id: 'fcdb0f92-bda6-47f9-bd05-343e0e020933',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		roomId: { type: 'string', format: 'misskey:id' },
		name: { type: 'string', maxLength: 256 },
		description: { type: 'string', maxLength: 1024 },
		visibility: { type: 'string', enum: ['public', 'private'] },
		def: { type: 'object', additionalProperties: true },
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

			// TODO: validate room

			await this.worldRoomService.update(room, {
				name: ps.name,
				description: ps.description,
				visibility: ps.visibility,
				def: ps.def,
			});
		});
	}
}
