import { Inject, Injectable } from '@nestjs/common';
import { MoreThan } from 'typeorm';
import { DI } from '@/di-symbols.js';
import type { UsersRepository, DriveFilesRepository } from '@/models/index.js';
import type { Config } from '@/config.js';
import type Logger from '@/logger.js';
import { DriveService } from '@/core/DriveService.js';
import { QueueLoggerService } from '../QueueLoggerService.js';
import type Bull from 'bull';
import type { DbJobDataWithUser } from '../types.js';
import { bindThis } from '@/decorators.js';

@Injectable()
export class DeleteDriveFilesProcessorService {
	private logger: Logger;

	constructor(
		@Inject(DI.config)
		private config: Config,

		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,

		private driveService: DriveService,
		private queueLoggerService: QueueLoggerService,
	) {
		this.logger = this.queueLoggerService.logger.createSubLogger('delete-drive-files');
	}

	@bindThis
	public async process(job: Bull.Job<DbJobDataWithUser>, done: () => void): Promise<void> {
		this.logger.info(`Deleting drive files of ${job.data.user.id} ...`);

		const user = await this.usersRepository.findOneBy({ id: job.data.user.id });
		if (user == null) {
			done();
			return;
		}

		let deletedCount = 0;
		let cursor: any = null;

		while (true) {
			const files = await this.driveFilesRepository.find({
				where: {
					userId: user.id,
					...(cursor ? { id: MoreThan(cursor) } : {}),
				},
				take: 100,
				order: {
					id: 1,
				},
			});

			if (files.length === 0) {
				job.progress(100);
				break;
			}

			cursor = files[files.length - 1].id;

			for (const file of files) {
				await this.driveService.deleteFileSync(file);
				deletedCount++;
			}

			const total = await this.driveFilesRepository.countBy({
				userId: user.id,
			});

			job.progress(deletedCount / total);
		}

		this.logger.succ(`All drive files (${deletedCount}) of ${user.id} has been deleted.`);
		done();
	}
}
