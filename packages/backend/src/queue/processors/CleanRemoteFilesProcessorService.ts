import { Inject, Injectable } from '@nestjs/common';
import { IsNull, MoreThan, Not } from 'typeorm';
import { DI } from '@/di-symbols.js';
import type { DriveFilesRepository } from '@/models/index.js';
import type { Config } from '@/config.js';
import type Logger from '@/logger.js';
import { DriveService } from '@/core/DriveService.js';
import { QueueLoggerService } from '../QueueLoggerService.js';
import type Bull from 'bull';
import { bindThis } from '@/decorators.js';

@Injectable()
export class CleanRemoteFilesProcessorService {
	private logger: Logger;

	constructor(
		@Inject(DI.config)
		private config: Config,

		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,

		private driveService: DriveService,
		private queueLoggerService: QueueLoggerService,
	) {
		this.logger = this.queueLoggerService.logger.createSubLogger('clean-remote-files');
	}

	@bindThis
	public async process(job: Bull.Job<Record<string, unknown>>, done: () => void): Promise<void> {
		this.logger.info('Deleting cached remote files...');

		let deletedCount = 0;
		let cursor: any = null;

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
				job.progress(100);
				break;
			}

			cursor = files[files.length - 1].id;

			await Promise.all(files.map(file => this.driveService.deleteFileSync(file, true)));

			deletedCount += 8;

			const total = await this.driveFilesRepository.countBy({
				userHost: Not(IsNull()),
				isLink: false,
			});

			job.progress(deletedCount / total);
		}

		this.logger.succ('All cached remote files has been deleted.');
		done();
	}
}
