/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import ms from 'ms';
import { Inject, Injectable } from '@nestjs/common';
import type { UsersRepository, NotesRepository } from '@/models/_.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { NoteEntityService } from '@/core/entities/NoteEntityService.js';
import { NoteUpdateService } from '@/core/NoteUpdateService.js';
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

		private getterService: GetterService,
		private noteEntityService: NoteEntityService,
		private noteUpdateService: NoteUpdateService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const note = await this.getterService.getNote(ps.noteId).catch(err => {
				if (err.id === '9725d0ce-ba28-4dde-95a7-2cbb2c15de24') throw new ApiError(meta.errors.noSuchNote);
				throw err;
			});

			if (note.userId !== me.id) {
				throw new ApiError(meta.errors.noSuchNote);
			}

			const data = {
				cw: ps.cw,
				text: ps.text,
			};

			const updatedNote = await this.noteUpdateService.update(await this.usersRepository.findOneByOrFail({ id: note.userId }), data, note, false);

			return {
				updatedNote: await this.noteEntityService.pack(updatedNote, me),
			};
		});
	}
}
