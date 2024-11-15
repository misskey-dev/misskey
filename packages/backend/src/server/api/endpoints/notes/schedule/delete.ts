/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import ms from 'ms';
import { Inject, Injectable } from '@nestjs/common';
import type { NoteScheduleRepository } from '@/models/_.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import { ApiError } from '@/server/api/error.js';
import { QueueService } from '@/core/QueueService.js';

export const meta = {
	tags: ['notes'],

	requireCredential: true,
	kind: 'write:notes-schedule',

	limit: {
		duration: ms('1hour'),
		max: 300,
	},

	errors: {
		noSuchNote: {
			message: 'No such note.',
			code: 'NO_SUCH_NOTE',
			id: 'a58056ba-8ba1-4323-8ebf-e0b585bc244f',
		},
		permissionDenied: {
			message: 'Permission denied.',
			code: 'PERMISSION_DENIED',
			id: 'c0da2fed-8f61-4c47-a41d-431992607b5c',
			httpStatusCode: 403,
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
		@Inject(DI.noteScheduleRepository)
		private noteScheduleRepository: NoteScheduleRepository,
		private queueService: QueueService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const note = await this.noteScheduleRepository.findOneBy({ id: ps.noteId });
			if (note === null) {
				throw new ApiError(meta.errors.noSuchNote);
			}
			if (note.userId !== me.id) {
				throw new ApiError(meta.errors.permissionDenied);
			}
			await this.noteScheduleRepository.delete({ id: ps.noteId });
			await this.queueService.ScheduleNotePostQueue.remove(ps.noteId);
		});
	}
}
