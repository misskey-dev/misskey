/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type { NoteDraftsRepository } from '@/models/_.js';
import type Logger from '@/logger.js';
import { NotificationService } from '@/core/NotificationService.js';
import { bindThis } from '@/decorators.js';
import { NoteCreateService } from '@/core/NoteCreateService.js';
import { QueueLoggerService } from '../QueueLoggerService.js';
import type * as Bull from 'bullmq';
import type { PostScheduledNoteJobData } from '../types.js';

@Injectable()
export class PostScheduledNoteProcessorService {
	private logger: Logger;

	constructor(
		@Inject(DI.noteDraftsRepository)
		private noteDraftsRepository: NoteDraftsRepository,

		private noteCreateService: NoteCreateService,
		private notificationService: NotificationService,
		private queueLoggerService: QueueLoggerService,
	) {
		this.logger = this.queueLoggerService.logger.createSubLogger('post-scheduled-note');
	}

	@bindThis
	public async process(job: Bull.Job<PostScheduledNoteJobData>): Promise<void> {
		const draft = await this.noteDraftsRepository.findOneBy({ id: job.data.noteDraftId });
		if (draft == null) {
			return;
		}

		const note = await this.noteCreateService.create(draft.user, draft);

		this.noteDraftsRepository.remove(draft);

		this.notificationService.createNotification(draft.userId, 'scheduledNotePosted', {
			noteId: note.id,
		});
	}
}
