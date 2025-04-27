/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import ms from 'ms';
import { NoteMutingService } from '@/core/note/NoteMutingService.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { ApiError } from '../../../error.js';

export const meta = {
	tags: ['notes'],

	requireCredential: true,

	kind: 'write:account',

	limit: {
		duration: ms('1hour'),
		max: 10,
	},

	errors: {
		noSuchNote: {
			message: 'No such note.',
			code: 'NO_SUCH_NOTE',
			id: 'a58e7999-f6d3-1780-a688-f43661719662',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		noteId: { type: 'string', format: 'misskey:id' },
		expiresAt: { type: 'integer', nullable: true },
	},
	required: ['noteId'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		private readonly noteMutingService: NoteMutingService,
	) {
		super(meta, paramDef, async (ps, me) => {
			try {
				await this.noteMutingService.create({
					userId: me.id,
					noteId: ps.noteId,
					expiresAt: ps.expiresAt ? new Date(ps.expiresAt) : null,
				});
			} catch (e) {
				if (e instanceof NoteMutingService.NoSuchNoteError) {
					throw new ApiError(meta.errors.noSuchNote);
				} else {
					throw e;
				}
			}
		});
	}
}
