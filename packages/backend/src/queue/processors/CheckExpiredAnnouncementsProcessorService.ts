/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import type Logger from '@/logger.js';
import { bindThis } from '@/decorators.js';
import { AnnouncementService } from '@/core/AnnouncementService.js';
import { QueueLoggerService } from '../QueueLoggerService.js';

@Injectable()
export class CheckExpiredAnnouncementsProcessorService {
	private logger: Logger;

	constructor(
		private announcementService: AnnouncementService,
		private queueLoggerService: QueueLoggerService,
	) {
		this.logger = this.queueLoggerService.logger.createSubLogger('check-expired-announcements');
	}

	@bindThis
	public async process(): Promise<void> {
		const archivedCount = await this.announcementService.archiveExpiredAnnouncements();

		if (archivedCount > 0) {
			this.logger.succ(`Archived ${archivedCount} expired announcements.`);
		} else {
			this.logger.debug('No expired announcements found.');
		}
	}
}
