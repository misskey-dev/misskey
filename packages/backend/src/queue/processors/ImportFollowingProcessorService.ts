import { Inject, Injectable } from '@nestjs/common';
import { IsNull, MoreThan } from 'typeorm';
import { DI_SYMBOLS } from '@/di-symbols.js';
import { Users } from '@/models/index.js';
import type { DriveFiles } from '@/models/index.js';
import type { Config } from '@/config/types.js';
import type Logger from '@/logger.js';
import { isSelfHost, toPuny } from '@/misc/convert-host.js';
import * as Acct from '@/misc/acct.js';
import type { ResolveUserService } from '@/services/remote/ResolveUserService.js';
import type { DownloadService } from '@/services/DownloadService.js';
import type { UserFollowingService } from '@/services/UserFollowingService.js';
import type Bull from 'bull';
import type { DbUserImportJobData } from '../types.js';
import type { QueueLoggerService } from '../QueueLoggerService.js';

@Injectable()
export class ImportFollowingProcessorService {
	#logger: Logger;

	constructor(
		@Inject(DI_SYMBOLS.config)
		private config: Config,

		@Inject('usersRepository')
		private usersRepository: typeof Users,

		@Inject('driveFilesRepository')
		private driveFilesRepository: typeof DriveFiles,

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

				let target = isSelfHost(host!) ? await Users.findOneBy({
					host: IsNull(),
					usernameLower: username.toLowerCase(),
				}) : await Users.findOneBy({
					host: toPuny(host!),
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
