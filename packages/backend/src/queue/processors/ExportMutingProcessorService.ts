import * as fs from 'node:fs';
import { Inject, Injectable } from '@nestjs/common';
import { IsNull, MoreThan } from 'typeorm';
import { format as dateFormat } from 'date-fns';
import { DI } from '@/di-symbols.js';
import type { MutingsRepository, UsersRepository, BlockingsRepository } from '@/models/index.js';
import type { Config } from '@/config.js';
import type Logger from '@/logger.js';
import { DriveService } from '@/core/DriveService.js';
import { createTemp } from '@/misc/create-temp.js';
import { UtilityService } from '@/core/UtilityService.js';
import { QueueLoggerService } from '../QueueLoggerService.js';
import type Bull from 'bull';
import type { DbJobDataWithUser } from '../types.js';
import { bindThis } from '@/decorators.js';

@Injectable()
export class ExportMutingProcessorService {
	private logger: Logger;

	constructor(
		@Inject(DI.config)
		private config: Config,

		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.blockingsRepository)
		private blockingsRepository: BlockingsRepository,

		@Inject(DI.mutingsRepository)
		private mutingsRepository: MutingsRepository,

		private utilityService: UtilityService,
		private driveService: DriveService,
		private queueLoggerService: QueueLoggerService,
	) {
		this.logger = this.queueLoggerService.logger.createSubLogger('export-muting');
	}

	@bindThis
	public async process(job: Bull.Job<DbJobDataWithUser>, done: () => void): Promise<void> {
		this.logger.info(`Exporting muting of ${job.data.user.id} ...`);

		const user = await this.usersRepository.findOneBy({ id: job.data.user.id });
		if (user == null) {
			done();
			return;
		}

		// Create temp file
		const [path, cleanup] = await createTemp();

		this.logger.info(`Temp file is ${path}`);

		try {
			const stream = fs.createWriteStream(path, { flags: 'a' });

			let exportedCount = 0;
			let cursor: any = null;

			while (true) {
				const mutes = await this.mutingsRepository.find({
					where: {
						muterId: user.id,
						expiresAt: IsNull(),
						...(cursor ? { id: MoreThan(cursor) } : {}),
					},
					take: 100,
					order: {
						id: 1,
					},
				});

				if (mutes.length === 0) {
					job.progress(100);
					break;
				}

				cursor = mutes[mutes.length - 1].id;

				for (const mute of mutes) {
					const u = await this.usersRepository.findOneBy({ id: mute.muteeId });
					if (u == null) {
						exportedCount++; continue;
					}

					const content = this.utilityService.getFullApAccount(u.username, u.host);
					await new Promise<void>((res, rej) => {
						stream.write(content + '\n', err => {
							if (err) {
								this.logger.error(err);
								rej(err);
							} else {
								res();
							}
						});
					});
					exportedCount++;
				}

				const total = await this.mutingsRepository.countBy({
					muterId: user.id,
				});

				job.progress(exportedCount / total);
			}

			stream.end();
			this.logger.succ(`Exported to: ${path}`);

			const fileName = 'mute-' + dateFormat(new Date(), 'yyyy-MM-dd-HH-mm-ss') + '.csv';
			const driveFile = await this.driveService.addFile({ user, path, name: fileName, force: true, ext: 'csv' });

			this.logger.succ(`Exported to: ${driveFile.id}`);
		} finally {
			cleanup();
		}

		done();
	}
}
