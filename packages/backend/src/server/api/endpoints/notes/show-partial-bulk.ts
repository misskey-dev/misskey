/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import * as v from 'valibot';
import * as mi from '@/misc/schema/index.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { NoteEntityService } from '@/core/entities/NoteEntityService.js';
import { GetterService } from '@/server/api/GetterService.js';
import { ApiError } from '../../error.js';

export const meta = {
	tags: ['notes'],

	requireCredential: false,

	res: v.array(v.object({
		id: v.string(),
		reactions: v.record(v.string(), v.number()),
		reactionEmojis: v.record(v.string(), v.string()),
	})),

	errors: {
	},
} as const;

export const paramDef = v.object({
	noteIds: v.pipe(v.array(mi.misskeyId()), v.minLength(1), v.maxLength(100)),
});

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		private noteEntityService: NoteEntityService,
	) {
		super(meta, paramDef, async (ps, me) => {
			return await this.noteEntityService.fetchDiffs(ps.noteIds);
		});
	}
}
