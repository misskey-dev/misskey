/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import type * as Bull from 'bullmq';
import type Logger from '@/logger.js';
import { bindThis } from '@/decorators.js';
import { AnnouncementService } from '@/core/AnnouncementService.js';
import type { ArchiveAnnouncementJobData } from '../types.js';
import { QueueLoggerService } from '../QueueLoggerService.js';

@Injectable()
export class ArchiveAnnouncementProcessorService {
	private logger: Logger;

	constructor(
		private announcementService: AnnouncementService,
		private queueLoggerService: QueueLoggerService,
	) {
		this.logger = this.queueLoggerService.logger.createSubLogger('archive-announcement');
	}

	@bindThis
	public async process(job: Bull.Job<ArchiveAnnouncementJobData>): Promise<void> {
		const archived = await this.announcementService.archiveAnnouncement(
			job.data.announcementId,
			new Date(job.data.autoArchiveAt),
		);

		if (archived) {
			this.logger.succ(`Archived announcement ${job.data.announcementId}.`);
		} else {
			this.logger.debug(`Announcement ${job.data.announcementId} no longer matches the scheduled archive job.`);
		}
	}
}
