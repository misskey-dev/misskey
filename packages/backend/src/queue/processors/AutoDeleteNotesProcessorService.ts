/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { IsNull, LessThan, Not } from 'typeorm';
import { DI } from '@/di-symbols.js';
import type { NotesRepository, UsersRepository } from '@/models/_.js';
import type Logger from '@/logger.js';
import { bindThis } from '@/decorators.js';
import { IdService } from '@/core/IdService.js';
import { QueueLoggerService } from '../QueueLoggerService.js';
import type * as Bull from 'bullmq';

@Injectable()
export class AutoDeleteNotesProcessorService {
	private logger: Logger;

	constructor(
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,

		private idService: IdService,
		private queueLoggerService: QueueLoggerService,
	) {
		this.logger = this.queueLoggerService.logger.createSubLogger('auto-delete-notes');
	}

	@bindThis
	public async process(job: Bull.Job<Record<string, unknown>>): Promise<{
		deletedCount: number;
		processedUsers: number;
	}> {
		this.logger.info('Starting auto-delete notes process...');

		const stats = {
			deletedCount: 0,
			processedUsers: 0,
		};

		// autoDeleteNotesAfterDays가 설정된 유저 찾기
		const usersWithAutoDelete = await this.usersRepository.findBy({
			autoDeleteNotesAfterDays: Not(IsNull()),
		});

		if (usersWithAutoDelete.length === 0) {
			this.logger.info('No users with auto-delete settings found.');
			return stats;
		}

		this.logger.info(`Found ${usersWithAutoDelete.length} users with auto-delete settings.`);

		// 각 유저별로 처리
		for (const user of usersWithAutoDelete) {
			try {
				const days = user.autoDeleteNotesAfterDays;
				if (days === null || days <= 0) continue;

				// 삭제 기준 날짜 계산
				const deleteBeforeDate = new Date(Date.now() - (days * 24 * 60 * 60 * 1000));
				const deleteBeforeId = this.idService.gen(deleteBeforeDate.getTime());

				this.logger.info(`Processing user ${user.id}: deleting notes older than ${days} days (before ${deleteBeforeDate.toISOString()})`);

				// 삭제할 노트 찾기
				const queryBuilder = this.notesRepository.createQueryBuilder('note')
					.where('note.userId = :userId', { userId: user.id })
					.andWhere('note.id < :deleteBeforeId', { deleteBeforeId });

				// 즐겨찾기 보호 설정이 켜져 있으면 즐겨찾기된 노트 제외
				if (user.autoDeleteKeepFavorites) {
					queryBuilder.andWhere('NOT EXISTS (SELECT 1 FROM note_favorite WHERE "noteId" = note.id)');
				}

				const notesToDelete = await queryBuilder
					.select('note.id')
					.limit(1000) // 한 번에 최대 1000개씩 처리
					.getMany();

				if (notesToDelete.length > 0) {
					const noteIds = notesToDelete.map(note => note.id);
					await this.notesRepository.delete(noteIds);

					stats.deletedCount += noteIds.length;
					this.logger.info(`Deleted ${noteIds.length} notes for user ${user.id}`);
				} else {
					this.logger.info(`No notes to delete for user ${user.id}`);
				}

				stats.processedUsers++;
			} catch (error) {
				this.logger.error(`Error processing user ${user.id}: ${error}`);
				// 한 유저의 에러가 전체 프로세스를 막지 않도록 계속 진행
			}
		}

		this.logger.succ(`Auto-delete notes process completed. Processed ${stats.processedUsers} users, deleted ${stats.deletedCount} notes.`);

		return stats;
	}
}
