/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import type * as Bull from 'bullmq';
import { format as dateFormat } from 'date-fns';
import { MoreThan } from 'typeorm';
import type { DriveService } from '@/core/DriveService.js';
import type { NotificationService } from '@/core/NotificationService.js';
import type { UtilityService } from '@/core/UtilityService.js';
import { bindThis } from '@/decorators.js';
import { DI } from '@/di-symbols.js';
import type Logger from '@/logger.js';
import { createTemp } from '@/misc/create-temp.js';
import type { BlockingsRepository, MiBlocking, UsersRepository } from '@/models/_.js';
import * as fs from 'node:fs';
import type { QueueLoggerService } from '../QueueLoggerService.js';
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

			const total = await this.blockingsRepository.countBy({
				blockerId: user.id,
			});

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
						stream.write(`${content}\n`, err => {
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

				job.updateProgress(exportedCount / total * 100);
			}

			stream.end();
			this.logger.succ(`Exported to: ${path}`);

			const fileName = `blocking-${dateFormat(new Date(), 'yyyy-MM-dd-HH-mm-ss')}.csv`;
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
