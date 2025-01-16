import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import type { ScheduledNotesRepository } from '@/models/_.js';
import { QueueService } from '@/core/QueueService.js';
import { ApiError } from '@/server/api/error.js';
import ms from 'ms';

export const meta = {
	tags: ['notes'],

	requireCredential: true,
	requireRolePolicy: 'canCreateContent',

	prohibitMoved: true,

	limit: {
		duration: ms('1hour'),
		max: 300,
	},

	kind: 'write:notes',

	errors: {
		noSuchDraft: {
			message: 'No such draft',
			code: 'NO_SUCH_DRAFT',
			id: '91c2ad21-fb45-4f2a-ba4c-ea749b262947',
		}
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		draftId: { type: 'string', format: 'misskey:id' },
	},
	required: ['draftId'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.scheduledNotesRepository)
		private scheduledNotesRepository: ScheduledNotesRepository,

		private queueService: QueueService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const draft = await this.scheduledNotesRepository.findOneBy({ id: ps.draftId, userId: me.id });
			if (!draft) throw new ApiError(meta.errors.noSuchDraft);

			await this.queueService.systemQueue.remove(`scheduledNote:${draft.id}`);
			await this.scheduledNotesRepository.delete({ id: draft.id });
		});
	}
}
