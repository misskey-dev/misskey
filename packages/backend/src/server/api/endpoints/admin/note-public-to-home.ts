/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as Redis from 'ioredis';
import type { NotesRepository, UsersRepository } from '@/models/_.js';
import { MiNote, MiPoll } from '@/models/_.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import { ModerationLogService } from '@/core/ModerationLogService.js';
import { ApiError } from '@/server/api/error.js';
import type { IEndpointMeta } from '@/server/api/endpoints.js';
import { FanoutTimelineService } from '@/core/FanoutTimelineService.js';
import { FeaturedService } from '@/core/FeaturedService.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,
	kind: 'write:notes',

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
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,

		@Inject(DI.redisForTimelines)
		private redisForTimelines: Redis.Redis,

		@Inject(DI.db)
		private db: DataSource,

		private moderationLogService: ModerationLogService,
		private fanoutTimelineService: FanoutTimelineService,
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

			const user = await this.usersRepository.findOneByOrFail({ id: note.userId });
			await moderationLogService.log(me, 'makeNoteHome', {
				noteId: note.id,
				noteUserId: note.userId,
				noteUserUsername: user.username,
				noteUserHost: user.host,
				note: note,
			});

			// update basic note info
			await this.db.transaction(async transactionalEntityManager => {
				// change visibility of the note
				await transactionalEntityManager.update(MiNote, { id: note.id }, { visibility: 'home' });
				await transactionalEntityManager.update(MiPoll, { noteId: note.id }, { noteVisibility: 'home' });

				// change visibility of pure renotes
				await transactionalEntityManager.createQueryBuilder()
					.from(MiNote, 'note')
					.update()
					.where('renoteId = :renoteId', { renoteId: note.id })
					.andWhere('text IS NULL')
					.andWhere('fileIds = \'{}\'')
					.andWhere('hasPoll = false')
					.andWhere('visibility = \'public\'')
					.set({ visibility: 'home' })
					.execute();
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
			this.fanoutTimelineService.remove('localTimeline', note.id, redisPipeline);
			this.fanoutTimelineService.remove('vmimiRelayTimeline', note.id, redisPipeline);
			if (note.replyId) {
				this.fanoutTimelineService.remove('localTimelineWithReplies', note.id, redisPipeline);
				this.fanoutTimelineService.remove(`localTimelineWithReplyTo:${note.replyUserId}`, note.id, redisPipeline);
				this.fanoutTimelineService.remove('vmimiRelayTimelineWithReplies', note.id, redisPipeline);
				//this.fanoutTimelineService.remove(`vmimiRelayTimelineWithReplyTo:${note.replyUserId}`, note.id, redisPipeline);
			}
			if (note.fileIds.length > 0) {
				this.fanoutTimelineService.remove('localTimelineWithFiles', note.id, redisPipeline);
				this.fanoutTimelineService.remove('vmimiRelayTimelineWithFiles', note.id, redisPipeline);
			}
			for (const renote of renotes) {
				this.fanoutTimelineService.remove('localTimeline', renote.id, redisPipeline);
				this.fanoutTimelineService.remove('vmimiRelayTimeline', renote.id, redisPipeline);
			}
			await redisPipeline.exec();

			// remove from highlights
			// since renotes are not included in featured, we don't need to remove them
			await featuredService.removeNote(note);
		});
	}
}
