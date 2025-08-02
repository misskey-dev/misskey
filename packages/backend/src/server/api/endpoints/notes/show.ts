/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { NoteEntityService } from '@/core/entities/NoteEntityService.js';
import { GetterService } from '@/server/api/GetterService.js';
import { DI } from '@/di-symbols.js';
import { MiMeta } from '@/models/Meta.js';
import { MiNote } from '@/models/Note.js';
import { IdentifiableError } from '@/misc/identifiable-error.js';
import { ApiError } from '../../error.js';

export const meta = {
	tags: ['notes'],

	requireCredential: false,

	res: {
		type: 'object',
		optional: false, nullable: false,
		ref: 'Note',
	},

	errors: {
		noSuchNote: {
			message: 'No such note.',
			code: 'NO_SUCH_NOTE',
			id: '24fcbfc6-2e37-42b6-8388-c29b3861a08d',
		},

		signinRequired: {
			message: 'Signin required.',
			code: 'SIGNIN_REQUIRED',
			id: '8e75455b-738c-471d-9f80-62693f33372e',
		},
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
		@Inject(DI.meta)
		private serverSettings: MiMeta,

		private noteEntityService: NoteEntityService,
		private getterService: GetterService,
	) {
		super(meta, paramDef, async (ps, me) => {
			let note: MiNote | void;
			try {
				note = await this.getterService.getNoteWithRelations(ps.noteId);
			} catch (err) {
				if (err instanceof IdentifiableError && err.id === '9725d0ce-ba28-4dde-95a7-2cbb2c15de24') {
					try {
						const deletedNote = await this.getterService.getDeletedNoteWithRelations(ps.noteId);

						return await this.noteEntityService.packDeletedNote(deletedNote, me, {
							detail: true,
						});
					} catch (err) {
						if (err instanceof IdentifiableError && err.id === 'f2d7e5b8-9d79-4996-b996-89b538a1b71f') {
							throw new ApiError(meta.errors.noSuchNote);
						}
						throw err;
					}
				}
				throw err;
			}

			if (note.user!.requireSigninToViewContents && me == null) {
				throw new ApiError(meta.errors.signinRequired);
			}

			if (this.serverSettings.ugcVisibilityForVisitor === 'none' && me == null) {
				throw new ApiError(meta.errors.signinRequired);
			}

			if (this.serverSettings.ugcVisibilityForVisitor === 'local' && note.userHost != null && me == null) {
				throw new ApiError(meta.errors.signinRequired);
			}

			return await this.noteEntityService.pack(note, me, {
				detail: true,
			});
		});
	}
}
