/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { NotePiningService } from '@/core/NotePiningService.js';
import { ApiError } from '../../error.js';

export const meta = {
	tags: ['account', 'notes'],

	requireCredential: true,

	kind: 'write:account',

	errors: {
		noSuchNote: {
			message: 'No such note.',
			code: 'NO_SUCH_NOTE',
			id: '454170ce-9d63-4a43-9da1-ea10afe81e21',
		},
	},

	res: {
		type: 'object',
		optional: false, nullable: false,
		ref: 'MeDetailed',
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		noteId: { type: 'string', format: 'misskey:id' },
	},
	required: ['noteId'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		private userEntityService: UserEntityService,
		private notePiningService: NotePiningService,
	) {
		super(meta, paramDef, async (ps, me) => {
			await this.notePiningService.removePinned(me, ps.noteId).catch(err => {
				if (err.id === 'b302d4cf-c050-400a-bbb3-be208681f40c') throw new ApiError(meta.errors.noSuchNote);
				throw err;
			});

			return await this.userEntityService.pack(me.id, me, {
				schema: 'MeDetailed',
			});
		});
	}
}
