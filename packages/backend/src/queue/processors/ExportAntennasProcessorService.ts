import fs from 'node:fs';
import { Inject, Injectable } from '@nestjs/common';
import { format as DateFormat } from 'date-fns';
import { DI } from '@/di-symbols.js';
import type { AntennasRepository, UsersRepository } from '@/models/index.js';
import type { Config } from '@/config.js';
import Logger from '@/logger.js';
import { DriveService } from '@/core/DriveService.js';
import { bindThis } from '@/decorators.js';
import { createTemp } from '@/misc/create-temp.js';
import { QueueLoggerService } from '../QueueLoggerService.js';
import type { DBExportAntennasData } from '../types.js';
import type Bull from 'bull';

@Injectable()
export class ExportAntennasProcessorService {
	private logger: Logger;

	constructor (
		@Inject(DI.config)
		private config: Config,

		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.antennasRepository)
		private antennsRepository: AntennasRepository,
		private driveService: DriveService,
		private queueLoggerService: QueueLoggerService,
	) {
		this.logger = this.queueLoggerService.logger.createSubLogger('export-antennas');
	}

	@bindThis
	public async process(job: Bull.Job<DBExportAntennasData>, done: () => void): Promise<void> {
		const user = await this.usersRepository.findOneBy({ id: job.data.user.id });
		if (user == null) {
			done();
			return;
		}
		const [path, cleanup] = await createTemp();
		const stream = fs.createWriteStream(path, { flags: 'a' });
		const write = (input: string): Promise<void> => {
			return new Promise((resolve, reject) => {
				stream.write(input, err => {
					if (err) {
						this.logger.error(err);
						reject();
					} else {
						resolve();
					}
				});
			});
		};
		try {
			const antennas = await this.antennsRepository.findBy({ userId: job.data.user.id });
			write('[');
			for (const [index, antenna] of antennas.entries()) {
				write(JSON.stringify({
					name: antenna.name,
					src: antenna.src,
					keywords: antenna.keywords,
					excludeKeywords: antenna.excludeKeywords,
					users: antenna.users,
					caseSensitive: antenna.caseSensitive,
					withReplies: antenna.withReplies,
					withFile: antenna.withFile,
					notify: antenna.notify,
				} as Omit<typeof antenna, 'id' | 'createdAt' | 'lastUsedAt' | 'userId' | 'userListId'>));
				if (antennas.length - 1 !== index) {
					write(', ');
				}
			}
			write(']');
			stream.end();

			const fileName = 'antennas-' + DateFormat(new Date(), 'yyyy-MM-dd-HH-mm-ss') + '.json';
			const driveFile = await this.driveService.addFile({ user, path, name: fileName, force: true, ext: 'json' });
			this.logger.succ('Exported to: ' + driveFile.id);
		} finally {
			cleanup();
			done();
		}
	}
}

