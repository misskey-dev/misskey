/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as fs from 'node:fs';
import { Inject, Injectable } from '@nestjs/common';
import { MoreThan } from 'typeorm';
import { format as dateFormat } from 'date-fns';
import { DI } from '@/di-symbols.js';
import type { UsersRepository, BlockingsRepository, MiBlocking } from '@/models/_.js';
import type Logger from '@/logger.js';
import { DriveService } from '@/core/DriveService.js';
import { createTemp } from '@/misc/create-temp.js';
import { UtilityService } from '@/core/UtilityService.js';
import { NotificationService } from '@/core/NotificationService.js';
import { bindThis } from '@/decorators.js';
import { QueueLoggerService } from '../QueueLoggerService.js';
import type * as Bull from 'bullmq';
import type { DbJobDataWithUser } from '../types.js';

@Injectable()
export class ExportBlockingProcessorService {
	private logger: Logger;

	constructor(
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.blockingsRepository)
		private blockingsRepository: BlockingsRepository,

		private utilityService: UtilityService,
		private notificationService: NotificationService,
		private driveService: DriveService,
		private queueLoggerService: QueueLoggerService,
	) {
		this.logger = this.queueLoggerService.logger.createSubLogger('export-blocking');
	}

	@bindThis
	public async process(job: Bull.Job<DbJobDataWithUser>): Promise<void> {
		this.logger.info(`Exporting blocking of ${job.data.user.id} ...`);

		const user = await this.usersRepository.findOneBy({ id: job.data.user.id });
		if (user == null) {
			return;
		}

		// Create temp file
		const [path, cleanup] = await createTemp();

		this.logger.info(`Temp file is ${path}`);

		try {
			const stream = fs.createWriteStream(path, { flags: 'a' });

			let exportedCount = 0;
			let cursor: MiBlocking['id'] | null = null;

			while (true) {
				const blockings = await this.blockingsRepository.find({
					where: {
						blockerId: user.id,
						...(cursor ? { id: MoreThan(cursor) } : {}),
					},
					take: 100,
					order: {
						id: 1,
					},
				});

				if (blockings.length === 0) {
					job.updateProgress(100);
					break;
				}

				cursor = blockings.at(-1)?.id ?? null;

				for (const block of blockings) {
					const u = await this.usersRepository.findOneBy({ id: block.blockeeId });
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

				const total = await this.blockingsRepository.countBy({
					blockerId: user.id,
				});

				job.updateProgress(exportedCount / total);
			}

			stream.end();
			this.logger.succ(`Exported to: ${path}`);

			const fileName = 'blocking-' + dateFormat(new Date(), 'yyyy-MM-dd-HH-mm-ss') + '.csv';
			const driveFile = await this.driveService.addFile({ user, path, name: fileName, force: true, ext: 'csv' });

			this.logger.succ(`Exported to: ${driveFile.id}`);

			this.notificationService.createNotification(user.id, 'exportCompleted', {
				exportedEntity: 'blocking',
				fileId: driveFile.id,
			});
		} finally {
			cleanup();
		}
	}
}
