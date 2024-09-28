import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type { NotesRepository, UsersRepository } from '@/models/_.js';
import type Logger from '@/logger.js';
import { bindThis } from '@/decorators.js';
import { NoteDeleteService } from '@/core/NoteDeleteService.js';
import { QueueLoggerService } from '../QueueLoggerService.js';
import type * as Bull from 'bullmq';
import type { ScheduledNoteDeleteJobData } from '../types.js';

@Injectable()
export class ScheduledNoteDeleteProcessorService {
	private logger: Logger;

	constructor(
		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,

		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		private noteDeleteService: NoteDeleteService,
		private queueLoggerService: QueueLoggerService,
	) {
		this.logger = this.queueLoggerService.logger.createSubLogger('scheduled-note-delete');
	}

	@bindThis
	public async process(job: Bull.Job<ScheduledNoteDeleteJobData>): Promise<void> {
		const note = await this.notesRepository.findOneBy({ id: job.data.noteId });
		if (note == null) {
			return;
		}

		const user = await this.usersRepository.findOneBy({ id: note.userId });
		if (user == null) {
			return;
		}

		await this.noteDeleteService.delete(user, note);
		this.logger.info(`Deleted note ${note.id}`);
	}
}
