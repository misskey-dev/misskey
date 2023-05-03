import { Injectable, Inject } from '@nestjs/common';
import Ajv from 'ajv';
import { IdService } from '@/core/IdService.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import Logger from '@/logger.js';
import { Antenna } from '@/models/index.js';
import type { AntennasRepository, DriveFilesRepository, UserListsRepository, UsersRepository } from '@/models/index.js';
import { DI } from '@/di-symbols.js';
import { bindThis } from '@/decorators.js';
import { DownloadService } from '@/core/DownloadService.js';
import { QueueLoggerService } from '../QueueLoggerService.js';
import { DbUserImportJobData } from '../types.js';
import type Bull from 'bull';

@Injectable()
export class ImportAntennasProcessorService {
	private logger: Logger;
	constructor (
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,
		@Inject(DI.antennasRepository)
		private antennasRepository: AntennasRepository,
		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,
		@Inject(DI.userListsRepository)
		private userListsRepository: UserListsRepository,
		private queueLoggerService: QueueLoggerService,
		private downloadService: DownloadService,
		private idService: IdService,
		private globalEventService: GlobalEventService,
	) {
		this.logger = this.queueLoggerService.logger.createSubLogger('import-antennas');
	}

	@bindThis
	public async process(job: Bull.Job<DbUserImportJobData>, done: () => void): Promise<void> {
		const user = await this.usersRepository.findOneBy({ id: job.data.user.id });
		if (user === null) {
			done();
			return;
		}
		const file = await this.driveFilesRepository.findOneBy({
			id: job.data.fileId,
		});
		if (file === null) {
			done();
			return;
		}
		const now = new Date();
		try {
			const validate = new Ajv().compile({
				type: 'object',
				properties: {
					name: { type: 'string', minLength: 1, maxLength: 100 },
					src: { type: 'string', enum: ['home', 'all', 'users', 'list'] },
					userListId: { 
						type: 'array', 
						items: {
							type: 'string',
						}, 
						nullable: true,
					},
					keywords: { type: 'array', items: {
						type: 'array', items: {
							type: 'string',
						},
					} },
					excludeKeywords: { type: 'array', items: {
						type: 'array', items: {
							type: 'string',
						},
					} },
					users: { type: 'array', items: {
						type: 'string',
					} },
					caseSensitive: { type: 'boolean' },
					withReplies: { type: 'boolean' },
					withFile: { type: 'boolean' },
					notify: { type: 'boolean' },
				},
				required: ['name', 'src', 'keywords', 'excludeKeywords', 'users', 'caseSensitive', 'withReplies', 'withFile', 'notify'],
			});
			const antennas: (Omit<Antenna, 'userListId'> & { userListId: string[] | null })[] = JSON.parse(await this.downloadService.downloadTextFile(file.url));
			for (const antenna of antennas) {
				if (antenna.keywords.length === 0 || antenna.keywords[0].every(x => x === '')) continue;
				if (!validate(antenna)) {
					this.logger.warn('Validation Failed');
					continue;
				}
				const result = await this.antennasRepository.insert({
					id: this.idService.genId(),
					createdAt: now,
					lastUsedAt: now,
					userId: job.data.user.id,
					name: antenna.name,
					src: antenna.src === 'list' && antenna.userListId ? 'users' : antenna.src,
					userListId: null,
					keywords: antenna.keywords,
					excludeKeywords: antenna.excludeKeywords,
					users: (antenna.src === 'list' && antenna.userListId !== null ? antenna.userListId : antenna.users).filter(Boolean),
					caseSensitive: antenna.caseSensitive,
					withReplies: antenna.withReplies,
					withFile: antenna.withFile,
					notify: antenna.notify,
				}).then(x => this.antennasRepository.findOneByOrFail(x.identifiers[0]));
				this.logger.succ('Antenna created: ' + result.id);
				this.globalEventService.publishInternalEvent('antennaCreated', result);
			}
		} catch (err: any) {
			this.logger.error(err);
		} finally {
			done();
		}
	}
}
