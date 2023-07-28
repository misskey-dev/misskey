/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { PromoNotesRepository } from '@/models/index.js';
import { GetterService } from '@/server/api/GetterService.js';
import { DI } from '@/di-symbols.js';
import { ApiError } from '../../../error.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,

	errors: {
		noSuchNote: {
			message: 'No such note.',
			code: 'NO_SUCH_NOTE',
			id: 'ee449fbe-af2a-453b-9cae-cf2fe7c895fc',
		},

		alreadyPromoted: {
			message: 'The note has already promoted.',
			code: 'ALREADY_PROMOTED',
			id: 'ae427aa2-7a41-484f-a18c-2c1104051604',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		noteId: { type: 'string', format: 'misskey:id' },
		expiresAt: { type: 'integer' },
	},
	required: ['noteId', 'expiresAt'],
} as const;

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject(DI.promoNotesRepository)
		private promoNotesRepository: PromoNotesRepository,

		private getterService: GetterService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const note = await this.getterService.getNote(ps.noteId).catch(e => {
				if (e.id === '9725d0ce-ba28-4dde-95a7-2cbb2c15de24') throw new ApiError(meta.errors.noSuchNote);
				throw e;
			});

			const exist = await this.promoNotesRepository.exist({ where: { noteId: note.id } });

			if (exist) {
				throw new ApiError(meta.errors.alreadyPromoted);
			}

			await this.promoNotesRepository.insert({
				noteId: note.id,
				expiresAt: new Date(ps.expiresAt),
				userId: note.userId,
			});
		});
	}
}
