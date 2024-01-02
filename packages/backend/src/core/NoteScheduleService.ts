/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';

import { QueryService } from '@/core/QueryService.js';
import { NotificationService } from '@/core/NotificationService.js';
import { DI } from '@/di-symbols.js';
import type { ScheduledNotesRepository } from '@/models/_.js';
import { bindThis } from '@/decorators.js';
import { MiUser } from '@/models/_.js';

const now = new Date();
@Injectable()
export class NoteScheduleService {
	constructor(
		@Inject(DI.scheduledNotesRepository)
		private scheduledNotesRepository: ScheduledNotesRepository,
		private notificationService: NotificationService,
		private queryService: QueryService,
	) {
	}
	@bindThis
	public async notifyExpiredItems(userId: MiUser['id']) {
		const query = this.queryService.makePaginationQuery(this.scheduledNotesRepository.createQueryBuilder('scheduleNote'))
			.andWhere('scheduleNote.userId = :userId', { userId });

		const scheduleNotes = await query.getMany();

		scheduleNotes.forEach((item) => {
			if (item.scheduledAt.getTime() < now.getTime()) {
				this.scheduledNotesRepository.remove(item);

				this.notificationService.createNotification(userId, 'noteSchedulingFailed', {
					scheduledNoteId: item.id,
				});
				return;
			}
		});
	}
}
