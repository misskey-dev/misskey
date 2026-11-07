/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as fs from 'node:fs';
import { Inject, Injectable } from '@nestjs/common';
import { IsNull } from 'typeorm';
import { format as dateFormat } from 'date-fns';
import mime from 'mime-types';
import { DI } from '@/di-symbols.js';
import type { EmojisRepository, UsersRepository } from '@/models/_.js';
import type { Config } from '@/config.js';
import type Logger from '@/logger.js';
import { DriveService } from '@/core/DriveService.js';
import { createTemp, createTempDir } from '@/misc/create-temp.js';
import { ZipArchive } from '@/misc/zip.js';
import { DownloadService } from '@/core/DownloadService.js';
import { NotificationService } from '@/core/NotificationService.js';
import { bindThis } from '@/decorators.js';
import { QueueLoggerService } from '../QueueLoggerService.js';
import type * as Bull from 'bullmq';

@Injectable()
export class ExportCustomEmojisProcessorService {
	private logger: Logger;

	constructor(
		@Inject(DI.config)
		private config: Config,

		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.emojisRepository)
		private emojisRepository: EmojisRepository,

		private driveService: DriveService,
		private downloadService: DownloadService,
		private queueLoggerService: QueueLoggerService,
		private notificationService: NotificationService,
	) {
		this.logger = this.queueLoggerService.logger.createSubLogger('export-custom-emojis');
	}

	@bindThis
	public async process(job: Bull.Job): Promise<void> {
		this.logger.info('Exporting custom emojis ...');

		const user = await this.usersRepository.findOneBy({ id: job.data.user.id });
		if (user == null) {
			return;
		}

		const [path, cleanup] = await createTempDir();

		this.logger.info(`Temp dir is ${path}`);

		const metaFileName = 'meta.json';
		const metaPath = path + '/' + metaFileName;

		fs.writeFileSync(metaPath, '', 'utf-8');

		const metaStream = fs.createWriteStream(metaPath, { flags: 'a' });

		const writeMeta = (text: string): Promise<void> => {
			return new Promise<void>((res, rej) => {
				metaStream.write(text, err => {
					if (err) {
						this.logger.error(err);
						rej(err);
					} else {
						res();
					}
				});
			});
		};

		await writeMeta(`{"metaVersion":2,"host":"${this.config.host}","exportedAt":"${new Date().toString()}","emojis":[`);

		const customEmojis = await this.emojisRepository.find({
			where: {
				host: IsNull(),
			},
			order: {
				id: 'ASC',
			},
		});

		// ZIP のエントリ名 (meta.json 以外) → 実ファイルのパス
		// name と host: null が同じレコードは DB 上で重複し得て、その場合 fileName も同じになるため、
		// fileName ごとに最後にダウンロードに成功したファイルだけを保持する
		const emojiFiles = new Map<string, string>();

		for (const emoji of customEmojis) {
			if (!/^[a-zA-Z0-9_]+$/.test(emoji.name)) {
				this.logger.error(`invalid emoji name: ${emoji.name}`);
				continue;
			}
			const ext = mime.extension(emoji.type ?? 'image/png');
			const fileName = emoji.name + (ext ? '.' + ext : '');
			// 失敗時に同じ fileName の別レコードのファイルを消さないよう、一時パスはレコードごとに分ける
			const emojiPath = path + '/emoji-' + emoji.id;
			fs.writeFileSync(emojiPath, '', 'binary');
			let downloaded = false;

			try {
				await this.downloadService.downloadUrl(emoji.originalUrl, emojiPath);
				downloaded = true;
			} catch (e) { // TODO: 何度か再試行
				this.logger.error(e instanceof Error ? e : new Error(e as string));
			}

			if (downloaded) {
				const prevPath = emojiFiles.get(fileName);
				if (prevPath != null) {
					fs.unlinkSync(prevPath);
				}
				emojiFiles.set(fileName, emojiPath);
			} else {
				fs.unlinkSync(emojiPath);
			}

			const content = JSON.stringify({
				fileName: fileName,
				downloaded: downloaded,
				emoji: emoji,
			});
			const isFirst = customEmojis.indexOf(emoji) === 0;

			await writeMeta(isFirst ? content : ',\n' + content);
		}

		await writeMeta(']}');

		// ZIP に入れる前に確実にディスクへ書き出しておく
		await new Promise<void>((res, rej) => {
			metaStream.on('error', rej);
			metaStream.end(res);
		});

		// Create archive
		const [archivePath, archiveCleanup] = await createTemp();
		try {
			const archive = await ZipArchive.create(archivePath);
			try {
				// エントリを 1 件ずつ直列に追加する
				await archive.addFile(metaFileName, metaPath);
				for (const [fileName, emojiPath] of emojiFiles) {
					await archive.addFile(fileName, emojiPath);
				}
			} catch (e) {
				await archive.abort();
				throw e;
			}
			await archive.close();

			this.logger.succ(`Exported to: ${archivePath}`);

			const fileName = 'custom-emojis-' + dateFormat(new Date(), 'yyyy-MM-dd-HH-mm-ss') + '.zip';
			const driveFile = await this.driveService.addFile({ user, path: archivePath, name: fileName, force: true });

			this.logger.succ(`Exported to: ${driveFile.id}`);

			this.notificationService.createNotification(user.id, 'exportCompleted', {
				exportedEntity: 'customEmoji',
				fileId: driveFile.id,
			});
		} finally {
			cleanup();
			archiveCleanup();
		}
	}
}
