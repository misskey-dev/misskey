/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { setTimeout } from 'node:timers/promises';
import { Inject, Injectable } from '@nestjs/common';
import { And, In, IsNull, LessThan, MoreThan, Not } from 'typeorm';
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

		let cursor: MiNote['id'] = this.idService.gen(Date.now() - (1000 * 60 * 60 * 24 * this.meta.remoteNotesCleaningExpiryDaysForEachNotes));

		while (true) {
			const batchBeginAt = Date.now();

			let notes: Pick<MiNote, 'id'>[] = await this.notesRepository.find({
				where: {
					id: LessThan(cursor),
					userHost: Not(IsNull()),
					clippedCount: 0,
					renoteCount: 0,
				},
				take: MAX_NOTE_COUNT_PER_QUERY,
				order: {
					// 新しい順
					// https://github.com/misskey-dev/misskey/pull/16292#issuecomment-3139376314
					id: -1,
				},
				select: ['id'],
			});

			const fetchedCount = notes.length;

			for (const note of notes) {
				if (note.id < cursor) {
					cursor = note.id;
				}
			}

			const pinings = notes.length === 0 ? [] : await this.userNotePiningsRepository.find({
				where: {
					noteId: In(notes.map(note => note.id)),
				},
				select: ['noteId'],
			});

			notes = notes.filter(note => {
				return !pinings.some(pining => pining.noteId === note.id);
			});

			const favorites = notes.length === 0 ? [] : await this.noteFavoritesRepository.find({
				where: {
					noteId: In(notes.map(note => note.id)),
				},
				select: ['noteId'],
			});

			notes = notes.filter(note => {
				return !favorites.some(favorite => favorite.noteId === note.id);
			});

			const replies = notes.length === 0 ? [] : await this.notesRepository.find({
				where: {
					replyId: In(notes.map(note => note.id)),
					userHost: IsNull(),
				},
				select: ['replyId'],
			});

			notes = notes.filter(note => {
				return !replies.some(reply => reply.replyId === note.id);
			});

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
