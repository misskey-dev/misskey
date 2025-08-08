/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { setTimeout } from 'node:timers/promises';
import { Inject, Injectable } from '@nestjs/common';
import { And, Brackets, In, IsNull, LessThan, MoreThan, Not } from 'typeorm';
import { DI } from '@/di-symbols.js';
import type { MiMeta, MiNote, NoteFavoritesRepository, NotesRepository, UserNotePiningsRepository } from '@/models/_.js';
import type Logger from '@/logger.js';
import { bindThis } from '@/decorators.js';
import { IdService } from '@/core/IdService.js';
import { QueueLoggerService } from '../QueueLoggerService.js';
import type * as Bull from 'bullmq';

@Injectable()
export class CleanRemoteNotesProcessorService {
	private logger: Logger;

	constructor(
		@Inject(DI.meta)
		private meta: MiMeta,

		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,

		@Inject(DI.noteFavoritesRepository)
		private noteFavoritesRepository: NoteFavoritesRepository,

		@Inject(DI.userNotePiningsRepository)
		private userNotePiningsRepository: UserNotePiningsRepository,

		private idService: IdService,
		private queueLoggerService: QueueLoggerService,
	) {
		this.logger = this.queueLoggerService.logger.createSubLogger('clean-remote-notes');
	}

	@bindThis
	public async process(job: Bull.Job<Record<string, unknown>>): Promise<{
		deletedCount: number;
		oldest: number | null;
		newest: number | null;
		skipped?: boolean;
	}> {
		if (!this.meta.enableRemoteNotesCleaning) {
			this.logger.info('Remote notes cleaning is disabled, skipping...');
			return {
				deletedCount: 0,
				oldest: null,
				newest: null,
				skipped: true,
			};
		}

		this.logger.info('cleaning remote notes...');

		const maxDuration = this.meta.remoteNotesCleaningMaxProcessingDurationInMinutes * 60 * 1000; // Convert minutes to milliseconds
		const startAt = Date.now();

		const MAX_NOTE_COUNT_PER_QUERY = 50;

		const stats = {
			deletedCount: 0,
			oldest: null as number | null,
			newest: null as number | null,
		};

		// The date limit for the newest note to be considered for deletion.
		// All notes newer than this limit will always be retained.
		const newestLimit = this.idService.gen(Date.now() - (1000 * 60 * 60 * 24 * this.meta.remoteNotesCleaningExpiryDaysForEachNotes));

		let cursor = '0'; // oldest note ID to start from

		while (true) {
			const batchBeginAt = Date.now();

			// We use string literals instead of query builder for several reasons:
			// - for removeCondition, we need to use it in having clause, which is not supported by Brackets.
			// - for recursive part, we need to preserve the order of columns, but typeorm query builder does not guarantee the order of columns in the result query

			// The condition for removing the notes.
			// The note must be:
			// - old enough (older than the newestLimit)
			// - a remote note (userHost is not null).
			// - not have clipped
			// - not have pinned on the user profile
			// - not has been favorite by any user
			const removeCondition = 'note.id < :newestLimit'
				+ ' AND note."clippedCount" = 0'
				+ ' AND note."userHost" IS NOT NULL'
				// using both userId and noteId instead of just noteId to use index on user_note_pining table.
				// This is safe because notes are only pinned by the user who created them.
				+ ' AND NOT EXISTS(SELECT 1 FROM "user_note_pining" WHERE "noteId" = note."id" AND "userId" = note."userId")'
				// We cannot use userId trick because users can favorite notes from other users.
				+ ' AND NOT EXISTS(SELECT 1 FROM "note_favorite" WHERE "noteId" = note."id")'
			;

			// The initiator query contains the oldest ${MAX_NOTE_COUNT_PER_QUERY} remote non-clipped notes
			const initiatorQuery = `
				SELECT "note"."id" AS "id", "note"."replyId" AS "replyId", "note"."renoteId" AS "renoteId", "note"."id" AS "initiatorId"
				FROM "note" "note" WHERE ${removeCondition} AND "note"."id" > :cursor ORDER BY "note"."id" ASC LIMIT ${MAX_NOTE_COUNT_PER_QUERY}`;

			// The union query queries the related notes and replies related to the initiator query
			const unionQuery = `
				SELECT "note"."id", "note"."replyId", "note"."renoteId", rn."initiatorId"
				FROM "note" "note"
					INNER JOIN "related_notes" "rn"
						ON "note"."replyId" = rn.id
						     OR "note"."renoteId" = rn.id
						     OR "note"."id" = rn."replyId"
						     OR "note"."id" = rn."renoteId"
			`;
			const recursiveQuery = `(${initiatorQuery}) UNION (${unionQuery})`;

			const removableInitiatorNotesQuery = this.notesRepository.createQueryBuilder('note')
				.select('rn."initiatorId"')
				.innerJoin('related_notes', 'rn', 'note.id = rn.id')
				.groupBy('rn."initiatorId"')
				.having(`bool_and(${removeCondition})`);

			const notesQuery = this.notesRepository.createQueryBuilder('note')
				.addCommonTableExpression(recursiveQuery, 'related_notes', { recursive: true })
				.select('note.id', 'id')
				.addSelect('rn."initiatorId"')
				.innerJoin('related_notes', 'rn', 'note.id = rn.id')
				.where(`rn."initiatorId" IN (${ removableInitiatorNotesQuery.getQuery() })`)
				.setParameters({ cursor, newestLimit });

			const notes: { id: MiNote['id'], initiatorId: MiNote['id'] }[] = await notesQuery.getRawMany();

			const fetchedCount = notes.length;

			// update the cursor to the newest initiatorId found in the fetched notes.
			// We don't use 'id' since the note can be newer than the initiator note.
			for (const note of notes) {
				if (cursor < note.initiatorId) {
					cursor = note.initiatorId;
				}
			}

			if (notes.length > 0) {
				await this.notesRepository.delete(notes.map(note => note.id));

				for (const note of notes) {
					const t = this.idService.parse(note.id).date.getTime();
					if (stats.oldest === null || t < stats.oldest) {
						stats.oldest = t;
					}
					if (stats.newest === null || t > stats.newest) {
						stats.newest = t;
					}
				}

				stats.deletedCount += notes.length;
			}

			job.log(`Deleted ${notes.length} of ${fetchedCount}; ${Date.now() - batchBeginAt}ms`);

			const elapsed = Date.now() - startAt;

			if (elapsed >= maxDuration) {
				this.logger.info(`Reached maximum duration of ${maxDuration}ms, stopping...`);
				job.log('Reached maximum duration, stopping cleaning.');
				job.updateProgress(100);
				break;
			}

			job.updateProgress((elapsed / maxDuration) * 100);

			await setTimeout(1000 * 5); // Wait a moment to avoid overwhelming the db
		}

		this.logger.succ('cleaning of remote notes completed.');

		return {
			deletedCount: stats.deletedCount,
			oldest: stats.oldest,
			newest: stats.newest,
			skipped: false,
		};
	}
}
