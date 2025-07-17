/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { setTimeout } from 'node:timers/promises';
import { Inject, Injectable } from '@nestjs/common';
import { IsNull, MoreThan, Not } from 'typeorm';
import { DI } from '@/di-symbols.js';
import type { MiNote, NotesRepository } from '@/models/_.js';
import type Logger from '@/logger.js';
import { bindThis } from '@/decorators.js';
import { QueueLoggerService } from '../QueueLoggerService.js';
import type * as Bull from 'bullmq';

@Injectable()
export class CleanRemoteNotesProcessorService {
	private logger: Logger;

	constructor(
		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,

		private queueLoggerService: QueueLoggerService,
	) {
		this.logger = this.queueLoggerService.logger.createSubLogger('clean-remote-notes');
	}

	@bindThis
	public async process(job: Bull.Job<Record<string, unknown>>): Promise<{
		deletedCount: number;
	}> {
		this.logger.info('garbage collecting remote notes...');

		const maxDuration = 1000 * 60 * 60; // 1 hour
		const startAt = Date.now();

		let deletedCount = 0;
		let cursor: MiNote['id'] | null = null;

		while (true) {
			const notes = await this.notesRepository.find({
				where: {
					userHost: Not(IsNull()),
					// TODO: お気に入りされてないか、クリップに入ってないかなどの判定
					...(cursor ? { id: MoreThan(cursor) } : {}),
				},
				take: 50,
				order: {
					id: 1,
				},
			});

			if (notes.length === 0) {
				job.updateProgress(100);
				break;
			}

			await this.notesRepository.delete(notes.map(note => note.id));

			cursor = notes.at(-1)?.id ?? null;

			deletedCount += notes.length;

			const elapsed = Date.now() - startAt;

			if (elapsed >= maxDuration) {
				this.logger.info(`Reached maximum duration of ${maxDuration}ms, stopping...`);
				job.log('Reached maximum duration, stopping garbage collection.');
				job.updateProgress(100);
				break;
			}

			job.updateProgress((elapsed / maxDuration) * 100);

			await setTimeout(1000 * 5); // Sleep for 5s to avoid overwhelming the db
		}

		this.logger.succ('garbage collection of remote notes completed.');

		return { deletedCount };
	}
}
