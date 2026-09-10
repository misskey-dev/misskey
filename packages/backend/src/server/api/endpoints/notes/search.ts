/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import * as v from 'valibot';
import * as mi from '@/misc/schema/index.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { SearchService } from '@/core/SearchService.js';
import { NoteEntityService } from '@/core/entities/NoteEntityService.js';
import { RoleService } from '@/core/RoleService.js';
import { IdService } from '@/core/IdService.js';
import { packedNoteSchema } from '@/models/schema/note.js';
import { ApiError } from '../../error.js';

export const meta = {
	tags: ['notes'],

	requireCredential: false,

	res: v.array(packedNoteSchema),

	errors: {
		unavailable: {
			message: 'Search of notes unavailable.',
			code: 'UNAVAILABLE',
			id: '0b44998d-77aa-4427-80d0-d2c9b8523011',
		},
	},
} as const;

export const paramDef = v.object({
	query: v.string(),
	rangeStartAt: v.optional(v.nullable(mi.integer())),
	rangeEndAt: v.optional(v.nullable(mi.integer())),
	sinceId: v.optional(mi.misskeyId()),
	untilId: v.optional(mi.misskeyId()),
	sinceDate: v.optional(mi.integer()),
	untilDate: v.optional(mi.integer()),
	limit: mi.limit({ max: 100, def: 10 }),
	offset: v.optional(mi.integer(), 0),
	host: v.optional(v.pipe(v.string(), v.description('The local host is represented with `.`.'))),
	userId: v.optional(v.nullable(mi.misskeyId()), null),
	channelId: v.optional(v.nullable(mi.misskeyId()), null),
});

// TODO: ロジックをサービスに切り出す

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		private noteEntityService: NoteEntityService,
		private searchService: SearchService,
		private roleService: RoleService,
		private idService: IdService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const untilId = ps.untilId ?? (ps.untilDate ? this.idService.gen(ps.untilDate!) : undefined);
			const sinceId = ps.sinceId ?? (ps.sinceDate ? this.idService.gen(ps.sinceDate!) : undefined);

			const policies = await this.roleService.getUserPolicies(me ? me.id : null);
			if (!policies.canSearchNotes) {
				throw new ApiError(meta.errors.unavailable);
			}

			const notes = await this.searchService.searchNote(ps.query, me, {
				userId: ps.userId,
				channelId: ps.channelId,
				host: ps.host,
				rangeStartAt: ps.rangeStartAt,
				rangeEndAt: ps.rangeEndAt,
			}, {
				untilId: untilId,
				sinceId: sinceId,
				limit: ps.limit,
			});

			return await this.noteEntityService.packMany(notes, me);
		});
	}
}
