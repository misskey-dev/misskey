/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import ms from 'ms';
import { Inject, Injectable } from '@nestjs/common';
import type { UsersRepository, NotesRepository } from '@/models/_.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { NoteDeleteService } from '@/core/NoteDeleteService.js';
import { DI } from '@/di-symbols.js';
import { GetterService } from '@/server/api/GetterService.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import { MAX_NOTE_TEXT_LENGTH } from '@/const.js';
import { ApiError } from '../../error.js';

export const meta = {
	tags: ['notes'],

	requireCredential: true,
	requireRolePolicy: 'canEditNote',

	kind: 'write:notes',

	limit: {
		duration: ms('1hour'),
		max: 10,
		minInterval: ms('1sec'),
	},

	errors: {
		noSuchNote: {
			message: 'No such note.',
			code: 'NO_SUCH_NOTE',
			id: 'a6584e14-6e01-4ad3-b566-851e7bf0d474',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		noteId: { type: 'string', format: 'misskey:id' },
		text: {
			type: 'string',
			minLength: 1,
			maxLength: MAX_NOTE_TEXT_LENGTH,
			nullable: false,
		},
		cw: { type: 'string', nullable: true, maxLength: 100 },
	},
	required: ['noteId', 'text', 'cw'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,

		private getterService: GetterService,
		private globalEventService: GlobalEventService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const note = await this.getterService.getNote(ps.noteId).catch(err => {
				if (err.id === '9725d0ce-ba28-4dde-95a7-2cbb2c15de24') throw new ApiError(meta.errors.noSuchNote);
				throw err;
			});

			if (note.userId !== me.id) {
				throw new ApiError(meta.errors.noSuchNote);
			}

			//[TEMPORARY WORKAROUND] BELOW is TEMPORARY WORKAROUND / BE SURE TO REMOVE IT WHEN #11944 IS SOLVED
			if (!note.localOnly) {
				throw new ApiError({
					message: 'Editing of notes that are not local only is temporarily unavailable. See #11944 for details.',
					code: 'FEDARATED_NOTE_EDITING_TEMPORARILY_UNAVAILABLE',
					id: 'a94142d4-3ead-4f65-a684-c1ba427c51b5',
				});
			}
			//[TEMPORARY WORKAROUND] AVOVE is TEMPORARY WORKAROUND / BE SURE TO REMOVE IT WHEN #11944 IS SOLVED

			await this.notesRepository.update({ id: note.id }, {
				updatedAt: new Date(),
				cw: ps.cw,
				text: ps.text,
			});

			this.globalEventService.publishNoteStream(note.id, 'updated', {
				cw: ps.cw,
				text: ps.text,
			});
		});
	}
}
