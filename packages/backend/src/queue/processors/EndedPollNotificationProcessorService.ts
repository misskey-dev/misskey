import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type { PollVotesRepository, NotesRepository } from '@/models/index.js';
import type { Config } from '@/config.js';
import type Logger from '@/logger.js';
import { CreateNotificationService } from '@/core/CreateNotificationService.js';
import { QueueLoggerService } from '../QueueLoggerService.js';
import type Bull from 'bull';
import type { EndedPollNotificationJobData } from '../types.js';
import { bindThis } from '@/decorators.js';

@Injectable()
export class EndedPollNotificationProcessorService {
	private logger: Logger;

	constructor(
		@Inject(DI.config)
		private config: Config,

		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,

		@Inject(DI.pollVotesRepository)
		private pollVotesRepository: PollVotesRepository,

		private createNotificationService: CreateNotificationService,
		private queueLoggerService: QueueLoggerService,
	) {
		this.logger = this.queueLoggerService.logger.createSubLogger('ended-poll-notification');
	}

	@bindThis
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
