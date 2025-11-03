/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import ms from 'ms';
import { Inject, Injectable } from '@nestjs/common';
import type { NotesRepository } from '@/models/_.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import { GetterService } from '@/server/api/GetterService.js';
import { RoleService } from '@/core/RoleService.js';
import { ApiError } from '../../error.js';

export const meta = {
	tags: ['notes'],

	requireCredential: true,

	requireModerator: true,

	kind: 'write:notes',

	limit: {
		duration: ms('1hour'),
		max: 100,
		minInterval: ms('3sec'),
	},

	errors: {
		noSuchNote: {
			message: 'No such note.',
			code: 'NO_SUCH_NOTE',
			id: '490be23f-8c1f-4796-819f-94cb4f9d1630',
		},

		accessDenied: {
			message: 'Access denied.',
			code: 'ACCESS_DENIED',
			id: 'fe8d7103-0ea8-4ec3-814d-f8b401dc69e9',
		},

		invalidVisibility: {
			message: 'Invalid visibility.',
			code: 'INVALID_VISIBILITY',
			id: '3d81ceae-475f-4600-b2a8-2bc116157532',
		},

		cannotChangeVisibility: {
			message: 'Cannot change visibility from public.',
			code: 'CANNOT_CHANGE_VISIBILITY',
			id: '5f7e3d74-9b5e-4b63-8d22-3e7f4f37e862',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		noteId: { type: 'string', format: 'misskey:id' },
		visibility: { type: 'string', enum: ['public', 'home', 'followers', 'specified'] },
	},
	required: ['noteId', 'visibility'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,

		private getterService: GetterService,
		private roleService: RoleService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const note = await this.getterService.getNote(ps.noteId).catch(err => {
				if (err.id === '9725d0ce-ba28-4dde-95a7-2cbb2c15de24') throw new ApiError(meta.errors.noSuchNote);
				throw err;
			});

			// 管理人・モデレーターのみ実行可能
			if (!await this.roleService.isModerator(me)) {
				throw new ApiError(meta.errors.accessDenied);
			}

			// publicのノートのみhomeに変更可能
			if (note.visibility !== 'public') {
				throw new ApiError(meta.errors.cannotChangeVisibility);
			}

			// visibilityをhomeに変更
			await this.notesRepository.update(note.id, {
				visibility: ps.visibility,
			});
		});
	}
}
