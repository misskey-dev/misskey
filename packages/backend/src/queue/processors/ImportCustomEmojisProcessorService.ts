import * as fs from 'node:fs';
import { Inject, Injectable } from '@nestjs/common';
import { IsNull, MoreThan, DataSource } from 'typeorm';
import unzipper from 'unzipper';
import { DI } from '@/di-symbols.js';
import type { EmojisRepository, DriveFilesRepository, UsersRepository } from '@/models/index.js';
import type { Config } from '@/config.js';
import type Logger from '@/logger.js';
import { CustomEmojiService } from '@/core/CustomEmojiService.js';
import { createTempDir } from '@/misc/create-temp.js';
import { DriveService } from '@/core/DriveService.js';
import { DownloadService } from '@/core/DownloadService.js';
import { QueueLoggerService } from '../QueueLoggerService.js';
import type Bull from 'bull';
import type { DbUserImportJobData } from '../types.js';

// TODO: 名前衝突時の動作を選べるようにする
@Injectable()
export class ImportCustomEmojisProcessorService {
	private logger: Logger;

	constructor(
		@Inject(DI.config)
		private config: Config,

		@Inject(DI.db)
		private db: DataSource,

		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,

		@Inject(DI.emojisRepository)
		private emojisRepository: EmojisRepository,

		private customEmojiService: CustomEmojiService,
		private driveService: DriveService,
		private downloadService: DownloadService,
		private queueLoggerService: QueueLoggerService,
	) {
		this.logger = this.queueLoggerService.logger.createSubLogger('import-custom-emojis');
	}

	public async process(job: Bull.Job<DbUserImportJobData>, done: () => void): Promise<void> {
		this.logger.info('Importing custom emojis ...');

		const file = await this.driveFilesRepository.findOneBy({
			id: job.data.fileId,
		});
		if (file == null) {
			done();
			return;
		}

		const [path, cleanup] = await createTempDir();

		this.logger.info(`Temp dir is ${path}`);

		const destPath = path + '/emojis.zip';

		try {
			fs.writeFileSync(destPath, '', 'binary');
			await this.downloadService.downloadUrl(file.url, destPath);
		} catch (e) { // TODO: 何度か再試行
			if (e instanceof Error || typeof e === 'string') {
				this.logger.error(e);
			}
			throw e;
		}

		const outputPath = path + '/emojis';
		const unzipStream = fs.createReadStream(destPath);
		const extractor = unzipper.Extract({ path: outputPath });
		extractor.on('close', async () => {
			const metaRaw = fs.readFileSync(outputPath + '/meta.json', 'utf-8');
			const meta = JSON.parse(metaRaw);

			for (const record of meta.emojis) {
				if (!record.downloaded) continue;
				const emojiInfo = record.emoji;
				const emojiPath = outputPath + '/' + record.fileName;
				await this.emojisRepository.delete({
					name: emojiInfo.name,
				});
				const driveFile = await this.driveService.addFile({
					user: null,
					path: emojiPath,
					name: record.fileName,
					force: true,
				});
				await this.customEmojiService.add({
					name: emojiInfo.name,
					category: emojiInfo.category,
					host: null,
					aliases: emojiInfo.aliases,
					driveFile,
				});
			}

			cleanup();
	
			this.logger.succ('Imported');
			done();
		});
		unzipStream.pipe(extractor);
		this.logger.succ(`Unzipping to ${outputPath}`);
	}
}
