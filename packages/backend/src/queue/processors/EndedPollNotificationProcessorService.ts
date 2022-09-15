import { Inject, Injectable } from '@nestjs/common';
import { MoreThan } from 'typeorm';
import { DI_SYMBOLS } from '@/di-symbols.js';
import type { PollVotes , Notes } from '@/models/index.js';
import type { Config } from '@/config.js';
import type Logger from '@/logger.js';
import type { CreateNotificationService } from '@/services/CreateNotificationService.js';
import type Bull from 'bull';
import type { EndedPollNotificationJobData } from '../types.js';
import type { QueueLoggerService } from '../QueueLoggerService.js';

@Injectable()
export class EndedPollNotificationProcessorService {
	#logger: Logger;

	constructor(
		@Inject(DI_SYMBOLS.config)
		private config: Config,

		@Inject('notesRepository')
		private notesRepository: typeof Notes,

		@Inject('pollVotesRepository')
		private pollVotesRepository: typeof PollVotes,

		private createNotificationService: CreateNotificationService,
		private queueLoggerService: QueueLoggerService,
	) {
		this.queueLoggerService.logger.createSubLogger('ended-poll-notification');
	}

	public async process(job: Bull.Job<EndedPollNotificationJobData>, done: () => void): Promise<void> {
		const note = await this.notesRepository.findOneBy({ id: job.data.noteId });
		if (note == null || !note.hasPoll) {
			done();
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
			this.createNotificationService.createNotification(userId, 'pollEnded', {
				noteId: note.id,
			});
		}

		done();
	}
}
