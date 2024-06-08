/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { IsNull, MoreThan, Not } from 'typeorm';
import { DI } from '@/di-symbols.js';
import type { MiDriveFile, DriveFilesRepository } from '@/models/_.js';
import type Logger from '@/logger.js';
import { DriveService } from '@/core/DriveService.js';
import { bindThis } from '@/decorators.js';
import { QueueLoggerService } from '../QueueLoggerService.js';
import type * as Bull from 'bullmq';

@Injectable()
export class CleanRemoteFilesProcessorService {
	private logger: Logger;

	constructor(
		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,

		private driveService: DriveService,
		private queueLoggerService: QueueLoggerService,
	) {
		this.logger = this.queueLoggerService.logger.createSubLogger('clean-remote-files');
	}

	@bindThis
	public async process(job: Bull.Job<Record<string, unknown>>): Promise<void> {
		this.logger.info('Deleting cached remote files...');

		let deletedCount = 0;
		let cursor: MiDriveFile['id'] | null = null;

		while (true) {
			const files = await this.driveFilesRepository.find({
				where: {
					userHost: Not(IsNull()),
					isLink: false,
					...(cursor ? { id: MoreThan(cursor) } : {}),
				},
				take: 8,
				order: {
					id: 1,
				},
			});

			if (files.length === 0) {
				job.updateProgress(100);
				break;
			}

			cursor = files.at(-1)?.id ?? null;

			await Promise.all(files.map(file => this.driveService.deleteFileSync(file, true)));

			deletedCount += 8;

			const total = await this.driveFilesRepository.countBy({
				userHost: Not(IsNull()),
				isLink: false,
			});

			job.updateProgress(100 / total * deletedCount);
		}

		this.logger.succ('All cached remote files has been deleted.');
	}
}
