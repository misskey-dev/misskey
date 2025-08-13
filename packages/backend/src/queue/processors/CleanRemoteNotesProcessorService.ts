/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { setTimeout } from 'node:timers/promises';
import { Inject, Injectable } from '@nestjs/common';
import { DataSource, IsNull, LessThan, QueryFailedError, Not } from 'typeorm';
import { DI } from '@/di-symbols.js';
import type { MiMeta, MiNote, NotesRepository } from '@/models/_.js';
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

		@Inject(DI.db)
		private db: DataSource,

		private idService: IdService,
		private queueLoggerService: QueueLoggerService,
	) {
		this.logger = this.queueLoggerService.logger.createSubLogger('clean-remote-notes');
	}

	@bindThis
	private computeProgress(minId: string, maxId: string, cursorLeft: string) {
		const minTs = this.idService.parse(minId).date.getTime();
		const maxTs = this.idService.parse(maxId).date.getTime();
		const cursorTs = this.idService.parse(cursorLeft).date.getTime();

		return ((cursorTs - minTs) / (maxTs - minTs)) * 100;
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

		//#region queries
		// The date limit for the newest note to be considered for deletion.
		// All notes newer than this limit will always be retained.
		const newestLimit = this.idService.gen(Date.now() - (1000 * 60 * 60 * 24 * this.meta.remoteNotesCleaningExpiryDaysForEachNotes));

		// The condition for removing the notes.
		// The note must be:
		// - old enough (older than the newestLimit)
		// - a remote note (userHost is not null).
		// - not have clipped
		// - not have pinned on the user profile
		// - not has been favorite by any user
		const removalCriteria = [
			'note."id" < :newestLimit',
			'note."clippedCount" = 0',
			'note."userHost" IS NOT NULL',
			'NOT EXISTS (SELECT 1 FROM user_note_pining WHERE "noteId" = note."id")',
			'NOT EXISTS (SELECT 1 FROM note_favorite WHERE "noteId" = note."id")',
		].join(' AND ');

		const idBounds = await this.notesRepository.createQueryBuilder('note')
			.select('MIN(note.id)', 'minId')
			.addSelect('MAX(note.id)', 'maxId')
			.where({
				id: LessThan(newestLimit),
				userHost: Not(IsNull()),
				replyId: IsNull(),
				renoteId: IsNull(),
			})
			.getRawOne<{ minId?: MiNote['id'], maxId?: MiNote['id'] }>();

		if (!idBounds) {
			this.logger.info('No notes can possibly be deleted, skipping...');
			return {
				deletedCount: 0,
				oldest: null,
				newest: null,
				skipped: false,
			};
		}

		const { minId, maxId } = idBounds;

		if (!minId || !maxId) {
			this.logger.info('No notes can possibly be deleted, skipping...');
			return {
				deletedCount: 0,
				oldest: null,
				newest: null,
				skipped: false,
			};
		}

		let cursorLeft = minId;

		const findRightCursor = (limit: number) =>
			this.notesRepository.createQueryBuilder('note')
				.select('note.id', 'id')
				.where('note."id" >= :cursorLeft')
				.andWhere('note."id" <= :newestLimit')
				.andWhere('note."replyId" IS NULL')
				.andWhere('note."renoteId" IS NULL')
				.andWhere(removalCriteria)
				.orderBy('note.id', 'ASC')
				.offset(limit)
				.setParameters({ newestLimit, cursorLeft })
				.getRawOne<{ id: MiNote['id'] }>().then(result => result?.id);

		const candidateNotesCteName = 'candidate_notes';

		// tree walk down all root notes, short-circuit when the first unremovable note is found
		const candidateNotesQueryBase = this.notesRepository.createQueryBuilder('note')
			.select('note."id"', 'id')
			.addSelect('note."replyId"', 'replyId')
			.addSelect('note."renoteId"', 'renoteId')
			.addSelect('note."id"', 'rootId')
			.addSelect('TRUE', 'isRemovable')
			.where('note."id" >= :cursorLeft')
			.andWhere('note."id" < :cursorRight')
			.andWhere(removalCriteria)
			.andWhere({ replyId: IsNull(), renoteId: IsNull() });

		const candidateNotesQueryInductive = this.notesRepository.createQueryBuilder('note')
			.select('note.id', 'id')
			.addSelect('note."replyId"', 'replyId')
			.addSelect('note."renoteId"', 'renoteId')
			.addSelect('parent."rootId"', 'rootId')
			.addSelect(removalCriteria, 'isRemovable')
			.innerJoin(candidateNotesCteName, 'parent', 'parent."id" = note."replyId" OR parent."id" = note."renoteId"')
			.where('parent."isRemovable" = TRUE');

		// A note tree can be deleted if there are no unremovable rows with the same rootId.
		//
		// `candidate_notes` will have the following structure after recursive query (some columns omitted):
		// After performing a LEFT JOIN with `candidate_notes` as `unremovable`,
		// the note tree containing unremovable notes will be anti-joined.
		// For removable rows, the `unremovable` columns will have `NULL` values.
		// | id  | rootId | isRemovable |
		// |-----|--------|-------------|
		// | aaa | aaa    | TRUE        |
		// | bbb | aaa    | FALSE       |
		// | ccc | aaa    | FALSE       |
		// | ddd | ddd    | TRUE        |
		// | eee | ddd    | TRUE        |
		// | fff | fff    | TRUE        |
		// | ggg | ggg    | FALSE       |
		//
		const candidateNotesQuery = this.db.createQueryBuilder()
			.select(`"${candidateNotesCteName}"."id"`, 'id')
			.addCommonTableExpression(
				`(${candidateNotesQueryBase.getQuery()} UNION ${candidateNotesQueryInductive.getQuery()})`,
				candidateNotesCteName,
				{ recursive: true },
			)
			.from(candidateNotesCteName, candidateNotesCteName)
			.leftJoin(candidateNotesCteName, 'unremovable', `unremovable."rootId" = "${candidateNotesCteName}"."rootId" AND unremovable."isRemovable" = FALSE`)
			.where('unremovable."id" IS NULL');

		const stats = {
			deletedCount: 0,
			oldest: null as number | null,
			newest: null as number | null,
		};

		// start with a conservative limit and adjust it based on the query duration
		let currentLimit = 100;
		let lowThroughputWarned = false;
		do {
			//#region check time
			const batchBeginAt = Date.now();

			const elapsed = batchBeginAt - startAt;

			if (elapsed >= maxDuration) {
				job.log(`Reached maximum duration of ${maxDuration}ms, stopping... (last cursor: ${cursorLeft}, final progress ${this.computeProgress(minId, maxId, cursorLeft)}%)`);
				job.updateProgress(100);
				break;
			}

			const progress = this.computeProgress(minId, maxId, cursorLeft);
			const wallClockUsage = elapsed / maxDuration;
			if (wallClockUsage > 0.5 && progress < 50 && !lowThroughputWarned) {
				const msg = `Not projected to finish in time! (wall clock usage ${wallClockUsage * 100}% at ${progress}%, current limit ${currentLimit})`;
				this.logger.warn(msg);
				job.log(msg);
				lowThroughputWarned = true;
			}
			job.updateProgress(progress);
			//#endregion

			let cursorRight = await findRightCursor(currentLimit);

			if (!cursorRight || cursorRight > newestLimit) {
				cursorRight = newestLimit;
			}

			const queryBegin = performance.now();
			const noteIds = await candidateNotesQuery.setParameters({ newestLimit, cursorLeft, cursorRight }).getRawMany<{ id: MiNote['id'] }>().then(result => result.map(r => r.id));

			const queryDuration = performance.now() - queryBegin;
			// try to adjust such that each query takes about 1~5 seconds and reasonable NodeJS heap so the task stays responsive
			// this should not oscillate..
			if (queryDuration > 5000 || noteIds.length > 5000) {
				currentLimit = Math.floor(currentLimit * 0.5);
			} else if (queryDuration < 1000 && noteIds.length < 1000) {
				currentLimit = Math.floor(currentLimit * 1.5);
			}
			// clamp to a sane range
			currentLimit = Math.min(Math.max(currentLimit, 10), 5000);

			if (noteIds.length > 0) {
				try {
					await this.notesRepository.delete(noteIds);

					for (const id of noteIds) {
						const t = this.idService.parse(id).date.getTime();
						if (stats.oldest === null || t < stats.oldest) {
							stats.oldest = t;
						}
						if (stats.newest === null || t > stats.newest) {
							stats.newest = t;
						}
					}

					stats.deletedCount += noteIds.length;
				} catch (e) {
					// check for integrity violation errors (class 23) that might have occurred between the check and the delete
					// we can safely continue to the next batch
					if (e instanceof QueryFailedError && e.driverError?.code?.startsWith('23')) {
						job.log(`Error deleting notes: ${e} (cursor: [${cursorLeft}, ${cursorRight}) (transient race condition?)`);
					} else {
						throw e;
					}
				}
			}

			// edge case breakout if maxId is the newest note and it is deleted while we are working on it
			if (cursorLeft === cursorRight || !cursorRight) {
				job.log('No more notes to clean. (cursorLeft === cursorRight)');
				break;
			}

			cursorLeft = cursorRight;

			job.log(`Deleted ${noteIds.length} notes; ${Date.now() - batchBeginAt}ms`);

			if (process.env.NODE_ENV !== 'test') {
				await setTimeout(Math.min(1000 * 5, queryDuration)); // Wait a moment to avoid overwhelming the db
			}
		} while (cursorLeft < maxId);

		this.logger.succ('cleaning of remote notes completed.');

		return {
			deletedCount: stats.deletedCount,
			oldest: stats.oldest,
			newest: stats.newest,
			skipped: false,
		};
	}
}
