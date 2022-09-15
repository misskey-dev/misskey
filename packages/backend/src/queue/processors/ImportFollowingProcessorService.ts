import { Inject, Injectable } from '@nestjs/common';
import { IsNull, MoreThan } from 'typeorm';
import { DI } from '@/di-symbols.js';
import { Users } from '@/models/index.js';
import type { DriveFiles } from '@/models/index.js';
import { Config } from '@/config.js';
import type Logger from '@/logger.js';
import * as Acct from '@/misc/acct.js';
import { ResolveUserService } from '@/services/remote/ResolveUserService.js';
import { DownloadService } from '@/services/DownloadService.js';
import { UserFollowingService } from '@/services/UserFollowingService.js';
import { UtilityService } from '@/services/UtilityService.js';
import { QueueLoggerService } from '../QueueLoggerService.js';
import type Bull from 'bull';
import type { DbUserImportJobData } from '../types.js';

@Injectable()
export class ImportFollowingProcessorService {
	#logger: Logger;

	constructor(
		@Inject(DI.config)
		private config: Config,

		@Inject('usersRepository')
		private usersRepository: typeof Users,

		@Inject('driveFilesRepository')
		private driveFilesRepository: typeof DriveFiles,

		private utilityService: UtilityService,
		private userFollowingService: UserFollowingService,
		private resolveUserService: ResolveUserService,
		private downloadService: DownloadService,
		private queueLoggerService: QueueLoggerService,
	) {
		this.queueLoggerService.logger.createSubLogger('import-following');
	}

	public async process(job: Bull.Job<DbUserImportJobData>, done: () => void): Promise<void> {
		this.#logger.info(`Importing following of ${job.data.user.id} ...`);

		const user = await this.usersRepository.findOneBy({ id: job.data.user.id });
		if (user == null) {
			done();
			return;
		}

		const file = await this.driveFilesRepository.findOneBy({
			id: job.data.fileId,
		});
		if (file == null) {
			done();
			return;
		}

		const csv = await this.downloadService.downloadTextFile(file.url);

		let linenum = 0;

		for (const line of csv.trim().split('\n')) {
			linenum++;

			try {
				const acct = line.split(',')[0].trim();
				const { username, host } = Acct.parse(acct);

				let target = this.utilityService.isSelfHost(host!) ? await Users.findOneBy({
					host: IsNull(),
					usernameLower: username.toLowerCase(),
				}) : await Users.findOneBy({
					host: this.utilityService.toPuny(host!),
					usernameLower: username.toLowerCase(),
				});

				if (host == null && target == null) continue;

				if (target == null) {
					target = await this.resolveUserService.resolveUser(username, host);
				}

				if (target == null) {
					throw `cannot resolve user: @${username}@${host}`;
				}

				// skip myself
				if (target.id === job.data.user.id) continue;

				this.#logger.info(`Follow[${linenum}] ${target.id} ...`);

				this.userFollowingService.follow(user, target);
			} catch (e) {
				this.#logger.warn(`Error in line:${linenum} ${e}`);
			}
		}

		this.#logger.succ('Imported');
		done();
	}
}
