/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import ms from 'ms';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { ClipService } from '@/core/ClipService.js';
import { ApiError } from '../../error.js';

export const meta = {
	tags: ['account', 'notes', 'clips'],

	requireCredential: true,

	prohibitMoved: true,

	kind: 'write:account',

	limit: {
		duration: ms('1hour'),
		max: 20,
	},

	errors: {
		noSuchClip: {
			message: 'No such clip.',
			code: 'NO_SUCH_CLIP',
			id: 'd6e76cc0-a1b5-4c7c-a287-73fa9c716dcf',
		},

		noSuchNote: {
			message: 'No such note.',
			code: 'NO_SUCH_NOTE',
			id: 'fc8c0b49-c7a3-4664-a0a6-b418d386bb8b',
		},

		alreadyClipped: {
			message: 'The note has already been clipped.',
			code: 'ALREADY_CLIPPED',
			id: '734806c4-542c-463a-9311-15c512803965',
		},

		tooManyClipNotes: {
			message: 'You cannot add notes to the clip any more.',
			code: 'TOO_MANY_CLIP_NOTES',
			id: 'f0dba960-ff73-4615-8df4-d6ac5d9dc118',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		clipId: { type: 'string', format: 'misskey:id' },
		noteId: { type: 'string', format: 'misskey:id' },
	},
	required: ['clipId', 'noteId'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		private clipService: ClipService,
	) {
		super(meta, paramDef, async (ps, me) => {
			try {
				await this.clipService.addNote(me, ps.clipId, ps.noteId);
			} catch (e) {
				if (e instanceof ClipService.NoSuchClipError) {
					throw new ApiError(meta.errors.noSuchClip);
				} else if (e instanceof ClipService.NoSuchNoteError) {
					throw new ApiError(meta.errors.noSuchNote);
				} else if (e instanceof ClipService.AlreadyAddedError) {
					throw new ApiError(meta.errors.alreadyClipped);
				} else if (e instanceof ClipService.TooManyClipNotesError) {
					throw new ApiError(meta.errors.tooManyClipNotes);
				} else {
					throw e;
				}
			}
		});
	}
}
