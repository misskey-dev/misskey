/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { IsNull } from 'typeorm';
import { DI } from '@/di-symbols.js';
import type { UsersRepository, DriveFilesRepository } from '@/models/_.js';
import type Logger from '@/logger.js';
import * as Acct from '@/misc/acct.js';
import { RemoteUserResolveService } from '@/core/RemoteUserResolveService.js';
import { DownloadService } from '@/core/DownloadService.js';
import { UserMutingService } from '@/core/UserMutingService.js';
import { UtilityService } from '@/core/UtilityService.js';
import { bindThis } from '@/decorators.js';
import { QueueLoggerService } from '../QueueLoggerService.js';
import type * as Bull from 'bullmq';
import type { DbUserImportJobData } from '../types.js';

@Injectable()
export class ImportMutingProcessorService {
	private logger: Logger;

	constructor(
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,

		private utilityService: UtilityService,
		private userMutingService: UserMutingService,
		private remoteUserResolveService: RemoteUserResolveService,
		private downloadService: DownloadService,
		private queueLoggerService: QueueLoggerService,
	) {
		this.logger = this.queueLoggerService.logger.createSubLogger('import-muting');
	}

	@bindThis
	public async process(job: Bull.Job<DbUserImportJobData>): Promise<void> {
		this.logger.info(`Importing muting of ${job.data.user.id} ...`);

		const user = await this.usersRepository.findOneBy({ id: job.data.user.id });
		if (user == null) {
			return;
		}

		const file = await this.driveFilesRepository.findOneBy({
			id: job.data.fileId,
		});
		if (file == null) {
			return;
		}

		const csv = await this.downloadService.downloadTextFile(file.url);

		let linenum = 0;

		for (const line of csv.trim().split('\n')) {
			linenum++;

			try {
				const acct = line.split(',')[0].trim();
				const { username, host } = Acct.parse(acct);

				if (!host) continue;

				let target = this.utilityService.isSelfHost(host) ? await this.usersRepository.findOneBy({
					host: IsNull(),
					usernameLower: username.toLowerCase(),
				}) : await this.usersRepository.findOneBy({
					host: this.utilityService.toPuny(host),
					usernameLower: username.toLowerCase(),
				});

				if (host == null && target == null) continue;

				if (target == null) {
					target = await this.remoteUserResolveService.resolveUser(username, host);
				}

				if (target == null) {
					throw new Error(`cannot resolve user: @${username}@${host}`);
				}

				// skip myself
				if (target.id === job.data.user.id) continue;

				this.logger.info(`Mute[${linenum}] ${target.id} ...`);

				await this.userMutingService.mute(user, target);
			} catch (e) {
				this.logger.warn(`Error in line:${linenum} ${e}`);
			}
		}

		this.logger.succ('Imported');
	}
}
