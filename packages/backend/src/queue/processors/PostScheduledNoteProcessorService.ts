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
		const draft = await this.noteDraftsRepository.findOne({ where: { id: job.data.noteDraftId }, relations: ['user'] });
		if (draft == null || draft.user == null || draft.scheduledAt == null || !draft.isActuallyScheduled) {
			return;
		}

		try {
			const note = await this.noteCreateService.fetchAndCreate(draft.user, {
				createdAt: new Date(),
				fileIds: draft.fileIds,
				poll: ps.poll ? {
					choices: ps.poll.choices,
					multiple: ps.poll.multiple ?? false,
					expiresAt: ps.poll.expiresAt ? new Date(ps.poll.expiresAt) : null,
				} : undefined,
				text: draft.text ?? null,
				replyId: draft.replyId,
				renoteId: draft.renoteId,
				cw: draft.cw,
				localOnly: draft.localOnly,
				reactionAcceptance: draft.reactionAcceptance,
				visibility: draft.visibility,
				visibleUserIds: draft.visibleUserIds,
				channelId: draft.channelId,
				apMentions: draft.noExtractMentions ? [] : undefined,
				apHashtags: draft.noExtractHashtags ? [] : undefined,
				apEmojis: draft.noExtractEmojis ? [] : undefined,
			});

			// await不要
			this.noteDraftsRepository.remove(draft);

			// await不要
			this.notificationService.createNotification(draft.userId, 'scheduledNotePosted', {
				noteId: note.id,
			});
		} catch (err) {
			this.notificationService.createNotification(draft.userId, 'scheduledNotePostFailed', {
				noteDraftId: draft.id,
			});
		}
	}
}
