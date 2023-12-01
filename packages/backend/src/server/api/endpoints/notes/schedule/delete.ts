/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import ms from 'ms';
import { Inject, Injectable } from '@nestjs/common';
import type { ScheduledNotesRepository } from '@/models/_.js';
import { QueueService } from '@/core/QueueService.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';

export const meta = {
	tags: ['notes'],

	requireCredential: true,

	limit: {
		duration: ms('1hour'),
		max: 300,
	},

	errors: {
		noSuchNote: {
			message: 'No such note.',
			code: 'NO_SUCH_NOTE',
			id: '490be23f-8c1f-4796-819f-94cb4f9d1630',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		scheduledNoteId: { type: 'string', format: 'misskey:id' },
	},
	required: ['scheduledNoteId'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.scheduledNotesRepository)
		private scheduledNotesRepository: ScheduledNotesRepository,

		private queueService: QueueService,
	) {
		super(meta, paramDef, async (ps, me) => {
			await this.scheduledNotesRepository.delete({ id: ps.scheduledNoteId });
			if (ps.scheduledNoteId) {
				await this.queueService.ScheduleNotePostQueue.remove(ps.scheduledNoteId);
			}
		});
	}
}
