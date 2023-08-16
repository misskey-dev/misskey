/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type { MiPollVotesRepository, MiNotesRepository } from '@/models/index.js';
import type Logger from '@/logger.js';
import { NotificationService } from '@/core/NotificationService.js';
import { bindThis } from '@/decorators.js';
import { QueueLoggerService } from '../QueueLoggerService.js';
import type * as Bull from 'bullmq';
import type { EndedPollNotificationJobData } from '../types.js';

@Injectable()
export class EndedPollNotificationProcessorService {
	private logger: Logger;

	constructor(
		@Inject(DI.notesRepository)
		private notesRepository: MiNotesRepository,

		@Inject(DI.pollVotesRepository)
		private pollVotesRepository: MiPollVotesRepository,

		private notificationService: NotificationService,
		private queueLoggerService: QueueLoggerService,
	) {
		this.logger = this.queueLoggerService.logger.createSubLogger('ended-poll-notification');
	}

	@bindThis
	public async process(job: Bull.Job<EndedPollNotificationJobData>): Promise<void> {
		const note = await this.notesRepository.findOneBy({ id: job.data.noteId });
		if (note == null || !note.hasPoll) {
			return;
		}

		const votes = await this.pollVotesRepository.createQueryBuilder('vote')
			.select('vote.userId')
			.where('vote.noteId = :noteId', { noteId: note.id })
			.innerJoinAndSelect('vote.user', 'user')
			.andWhere('user.host IS NULL')
			.getMany();

		const userIds = [...new Set([note.userId, ...votes.map(v => v.userId)])];

		for (const userId of userIds) {
			this.notificationService.createNotification(userId, 'pollEnded', {
				noteId: note.id,
			});
		}
	}
}
