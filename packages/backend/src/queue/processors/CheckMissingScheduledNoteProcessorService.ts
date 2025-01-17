import { Inject, Injectable } from '@nestjs/common';
import * as Redis from 'ioredis';
import { DI } from '@/di-symbols.js';
import type { ScheduledNotesRepository } from '@/models/_.js';
import type Logger from '@/logger.js';
import { bindThis } from '@/decorators.js';
import { acquireDistributedLock } from '@/misc/distributed-lock.js';
import { QueueService } from '@/core/QueueService.js';
import { QueueLoggerService } from '../QueueLoggerService.js';

@Injectable()
export class CheckMissingScheduledNoteProcessorService {
	private logger: Logger;

	constructor(
		@Inject(DI.redisForTimelines)
		private redisForTimelines: Redis.Redis,

		@Inject(DI.scheduledNotesRepository)
		private scheduledNotesRepository: ScheduledNotesRepository,

		private queueService: QueueService,
		private queueLoggerService: QueueLoggerService,
	) {
		this.logger = this.queueLoggerService.logger.createSubLogger('note:scheduled');
	}

	@bindThis
	public async process(): Promise<void> {
		this.logger.info(`checking missing scheduled note tasks`);

		try {
			await acquireDistributedLock(this.redisForTimelines, `note:scheduled:check`, 3 * 60 * 1000, 1, 1000);
		} catch (e) {
			this.logger.warn(`check is already being processed`);
			return;
		}

		const query = this.scheduledNotesRepository.createQueryBuilder('draft')
			.where('draft.scheduledAt < now() + interval \'10 minutes\'').orderBy('draft.createdAt', 'ASC');

		let lastId = '0';
		while (true) {
			const drafts = await query.andWhere('draft.id > :lastId', { lastId }).limit(100).getMany();

			if (drafts.length === 0) {
				break;
			}

			for (const draft of drafts.filter(draft => draft.scheduledAt !== null)) {
				const jobState = await this.queueService.systemQueue.getJobState(`scheduledNote:${draft.id}`);
				if (jobState !== 'unknown') continue;

				this.logger.warn(`found missing scheduled note task: ${draft.id}`);
				await this.queueService.createScheduledNoteJob(draft.id, draft.scheduledAt!);
			}

			lastId = drafts[drafts.length - 1].id;
		}
	}
}
