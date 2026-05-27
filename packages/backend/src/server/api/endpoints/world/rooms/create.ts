/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import ms from 'ms';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import { ApiError } from '@/server/api/error.js';
import { WorldRoomService } from '@/core/WorldRoomService.js';
import { WorldRoomEntityService } from '@/core/entities/WorldRoomEntityService.js';

export const meta = {
	tags: ['worldRoom'],

	requireCredential: true,

	prohibitMoved: true,

	kind: 'write:worldRoom',

	limit: {
		duration: ms('1day'),
		max: 10,
	},

	res: {
		type: 'object',
		optional: false, nullable: false,
		ref: 'WorldRoomDetailed',
	},

	errors: {
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		name: { type: 'string', maxLength: 256 },
		description: { type: 'string', maxLength: 1024 },
		visibility: { type: 'string', enum: ['public', 'private'] },
		def: { type: 'object', additionalProperties: true },
	},
	required: ['name', 'visibility', 'def'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		private worldRoomService: WorldRoomService,
		private worldRoomEntityService: WorldRoomEntityService,
	) {
		super(meta, paramDef, async (ps, me) => {
			// TODO: validate room

			const room = await this.worldRoomService.create(me, {
				name: ps.name,
				description: ps.description ?? '',
				visibility: ps.visibility,
				def: ps.def,
			});
			return await this.worldRoomEntityService.packDetailed(room);
		});
	}
}
