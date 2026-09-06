/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import { WorldRoomService } from '@/core/WorldRoomService.js';
import { WorldRoomEntityService } from '@/core/entities/WorldRoomEntityService.js';
import { ApiError } from '@/server/api/error.js';
import { IdService } from '@/core/IdService.js';

export const meta = {
	tags: ['worldRoom'],

	requireCredential: true,

	kind: 'read:worldRoom',

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'object',
			optional: false, nullable: false,
			ref: 'WorldRoomLite',
		},
	},

	errors: {
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		userId: { type: 'string', format: 'misskey:id' },
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 30 },
		sinceId: { type: 'string', format: 'misskey:id' },
		untilId: { type: 'string', format: 'misskey:id' },
		sinceDate: { type: 'integer' },
		untilDate: { type: 'integer' },
	},
	required: ['userId'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		private worldRoomEntityService: WorldRoomEntityService,
		private worldRoomService: WorldRoomService,
		private idService: IdService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const untilId = ps.untilId ?? (ps.untilDate ? this.idService.gen(ps.untilDate!) : null);
			const sinceId = ps.sinceId ?? (ps.sinceDate ? this.idService.gen(ps.sinceDate!) : null);

			const rooms = await this.worldRoomService.getRoomsOfUserWithPagination(ps.userId, ps.userId === me.id, ps.limit, sinceId, untilId);
			return this.worldRoomEntityService.packLiteMany(rooms, me);
		});
	}
}
