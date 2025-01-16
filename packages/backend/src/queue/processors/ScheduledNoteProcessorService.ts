import { Inject, Injectable } from '@nestjs/common';
import { IsNull } from 'typeorm';
import * as Bull from 'bullmq';
import * as Redis from 'ioredis';
import { DI } from '@/di-symbols.js';
import { MiNote, type ScheduledNotesRepository } from '@/models/_.js';
import type Logger from '@/logger.js';
import { bindThis } from '@/decorators.js';
import { IdentifiableError } from '@/misc/identifiable-error.js';
import { acquireDistributedLock } from '@/misc/distributed-lock.js';
import { NotificationService } from '@/core/NotificationService.js';
import { NoteCreateService } from '@/core/NoteCreateService.js';
import { QueueLoggerService } from '../QueueLoggerService.js';
import type { ScheduledNoteJobData } from '../types.js';

@Injectable()
export class ScheduledNoteProcessorService {
	private logger: Logger;

	constructor(
		@Inject(DI.redisForTimelines)
		private redisForTimelines: Redis.Redis,

		@Inject(DI.scheduledNotesRepository)
		private scheduledNotesRepository: ScheduledNotesRepository,

		private notificationService: NotificationService,
		private noteCreateService: NoteCreateService,
		private queueLoggerService: QueueLoggerService,
	) {
		this.logger = this.queueLoggerService.logger.createSubLogger('note:scheduled');
	}

	@bindThis
	public async process(job: Bull.Job<ScheduledNoteJobData>): Promise<string> {
		this.logger.info(`processing ${job.data.draftId}`);

		try {
			await acquireDistributedLock(this.redisForTimelines, `note:scheduled:${job.data.draftId}`, 30 * 1000, 1, 100);
		} catch (e) {
			this.logger.warn(`draft=${job.data.draftId} is already being processed`);
			return 'ok';
		}

		const draft = await this.scheduledNotesRepository.findOne({
			where: { id: job.data.draftId, reason: IsNull() },
			relations: ['user'],
		});

		if (draft == null) {
			this.logger.warn(`draft not found: ${job.data.draftId}`);
			return 'ok';
		}

		if (!draft.user || draft.user.isSuspended) {
			this.logger.warn(`user is suspended: ${draft.userId}`);
			await this.scheduledNotesRepository.delete({ id: draft.id });
			return 'ok';
		}

		try {
			const note = (await this.noteCreateService.create(draft.user, {
				...draft.draft,
				createdAt: new Date(),
				scheduledAt: null,
			})) as MiNote;

			await this.scheduledNotesRepository.delete({ id: draft.id });

			this.notificationService.createNotification(draft.userId, "scheduledNotePosted", {
				noteId: note.id,
			});

			return 'ok';
		} catch (e) {
			if (e instanceof IdentifiableError) {
				if ([
					'e11b3a16-f543-4885-8eb1-66cad131dbfd',
					'689ee33f-f97c-479a-ac49-1b9f8140af99',
					'9f466dab-c856-48cd-9e65-ff90ff750580',
					'85ab9bd7-3a41-4530-959d-f07073900109',
					'd450b8a9-48e4-4dab-ae36-f4db763fda7c',
				].includes(e.id)) {
					this.logger.warn(`creating note from draft=${draft.id} failed: ${e.message}`);

					await this.scheduledNotesRepository.update({ id: draft.id }, {
						scheduledAt: null,
						reason: e.message,
					});

					this.notificationService.createNotification(draft.userId, "scheduledNoteError", {
						draftId: draft.id,
					});

					return e.message;
				}
			}
			throw e;
		}
	}
}
