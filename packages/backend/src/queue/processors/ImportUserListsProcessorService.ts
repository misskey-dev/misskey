import { Inject, Injectable } from '@nestjs/common';
import { IsNull } from 'typeorm';
import { DI } from '@/di-symbols.js';
import type { UsersRepository, DriveFilesRepository, UserListJoiningsRepository, UserListsRepository } from '@/models/index.js';
import type { Config } from '@/config.js';
import type Logger from '@/logger.js';
import * as Acct from '@/misc/acct.js';
import { RemoteUserResolveService } from '@/core/RemoteUserResolveService.js';
import { DownloadService } from '@/core/DownloadService.js';
import { UserListService } from '@/core/UserListService.js';
import { IdService } from '@/core/IdService.js';
import { UtilityService } from '@/core/UtilityService.js';
import { bindThis } from '@/decorators.js';
import { QueueLoggerService } from '../QueueLoggerService.js';
import type Bull from 'bull';
import type { DbUserImportJobData } from '../types.js';

@Injectable()
export class ImportUserListsProcessorService {
	private logger: Logger;

	constructor(
		@Inject(DI.config)
		private config: Config,

		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,

		@Inject(DI.userListsRepository)
		private userListsRepository: UserListsRepository,

		@Inject(DI.userListJoiningsRepository)
		private userListJoiningsRepository: UserListJoiningsRepository,

		private utilityService: UtilityService,
		private idService: IdService,
		private userListService: UserListService,
		private remoteUserResolveService: RemoteUserResolveService,
		private downloadService: DownloadService,
		private queueLoggerService: QueueLoggerService,
	) {
		this.logger = this.queueLoggerService.logger.createSubLogger('import-user-lists');
	}

	@bindThis
	public async process(job: Bull.Job<DbUserImportJobData>, done: () => void): Promise<void> {
		this.logger.info(`Importing user lists of ${job.data.user.id} ...`);

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
				const listName = line.split(',')[0].trim();
				const { username, host } = Acct.parse(line.split(',')[1].trim());

				let list = await this.userListsRepository.findOneBy({
					userId: user.id,
					name: listName,
				});

				if (list == null) {
					list = await this.userListsRepository.insert({
						id: this.idService.genId(),
						createdAt: new Date(),
						userId: user.id,
						name: listName,
					}).then(x => this.userListsRepository.findOneByOrFail(x.identifiers[0]));
				}

				let target = this.utilityService.isSelfHost(host!) ? await this.usersRepository.findOneBy({
					host: IsNull(),
					usernameLower: username.toLowerCase(),
				}) : await this.usersRepository.findOneBy({
					host: this.utilityService.toPuny(host!),
					usernameLower: username.toLowerCase(),
				});

				if (target == null) {
					target = await this.remoteUserResolveService.resolveUser(username, host);
				}

				if (await this.userListJoiningsRepository.findOneBy({ userListId: list!.id, userId: target.id }) != null) continue;

				this.userListService.push(target, list!, user);
			} catch (e) {
				this.logger.warn(`Error in line:${linenum} ${e}`);
			}
		}

		this.logger.succ('Imported');
		done();
	}
}
