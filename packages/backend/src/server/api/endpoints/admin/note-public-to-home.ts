/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as Redis from 'ioredis';
import type { NotesRepository } from '@/models/_.js';
import { MiNote, MiPoll } from '@/models/_.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import { ModerationLogService } from '@/core/ModerationLogService.js';
import { ApiError } from '@/server/api/error.js';
import type { IEndpointMeta } from '@/server/api/endpoints.js';
import { FunoutTimelineService } from '@/core/FunoutTimelineService.js';
import { FeaturedService } from '@/core/FeaturedService.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,

	errors: {
		noteNotFound: {
			message: 'Note not found.',
			code: 'NOTE_NOT_FOUND',
			id: 'b107f543-27fb-4bac-9549-9bbb64d95e85',
		},
		noteNotPublic: {
			message: 'Note is not public',
			code: 'NOTE_NOT_PUBLIC',
			id: '561e3371-6ef1-457b-8fdc-736a6e914782',
		},
	},
} as const satisfies IEndpointMeta;

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
		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,

		@Inject(DI.redisForTimelines)
		private redisForTimelines: Redis.Redis,

		@Inject(DI.db)
		private db: DataSource,

		private moderationLogService: ModerationLogService,
		private funoutTimelineService: FunoutTimelineService,
		private featuredService: FeaturedService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const note = await this.notesRepository.findOneBy({ id: ps.noteId });

			if (note == null) {
				throw new ApiError(meta.errors.noteNotFound);
			}

			if (note.visibility !== 'public') {
				throw new ApiError(meta.errors.noteNotPublic);
			}

			// Note: by design, visibility of replies and quoted renotes are not changed
			// replies and quoted renotes have their own text, so it's another moderation entity

			await moderationLogService.log(me, 'makeNoteHome', { targetNoteId: note.id });

			// update basic note info
			await this.db.transaction(async transactionalEntityManager => {
				// change visibility of the note
				await transactionalEntityManager.update(MiNote, { id: note.id }, { visibility: 'home' });
				await transactionalEntityManager.update(MiPoll, { noteId: note.id }, { noteVisibility: 'home' });

				// change visibility of pure renotes
				await transactionalEntityManager.update(MiNote, {
					renoteId: note.id,
					text: null,
					fileIds: [],
					hasPoll: false,
					visibility: 'public',
				}, { visibility: 'home' });
			});

			// collect renotes after changing visibility of original note
			const renotes = await this.notesRepository.createQueryBuilder('note')
				.where('note.renoteId = :renoteId', { renoteId: note.id })
				.andWhere('note.text IS NULL')
				.andWhere('note.fileIds = \'{}\'')
				.andWhere('note.hasPoll = false')
				.andWhere('note.visibility = \'home\'')
				.getMany();

			// remove from funout local timeline
			const redisPipeline = this.redisForTimelines.pipeline();
			this.funoutTimelineService.remove('localTimeline', note.id, redisPipeline);
			if (note.fileIds.length > 0) {
				this.funoutTimelineService.remove('localTimelineWithFiles', note.id, redisPipeline);
			}
			for (const renote of renotes) {
				this.funoutTimelineService.remove('localTimeline', renote.id, redisPipeline);
			}
			await redisPipeline.exec();

			// remove from highlights
			// since renotes are not included in featured, we don't need to remove them
			await featuredService.removeNote(note);
		});
	}
}
