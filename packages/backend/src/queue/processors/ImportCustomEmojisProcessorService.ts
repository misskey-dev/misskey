/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as fs from 'node:fs';
import { Inject, Injectable } from '@nestjs/common';
import { IsNull } from 'typeorm';
import { DI } from '@/di-symbols.js';
import type { EmojisRepository, DriveFilesRepository } from '@/models/_.js';
import type Logger from '@/logger.js';
import { CustomEmojiService } from '@/core/CustomEmojiService.js';
import { createTempDir } from '@/misc/create-temp.js';
import { ZipFile } from '@/misc/zip.js';
import { DriveService } from '@/core/DriveService.js';
import { DownloadService } from '@/core/DownloadService.js';
import { bindThis } from '@/decorators.js';
import { QueueLoggerService } from '../QueueLoggerService.js';
import type * as Bull from 'bullmq';
import type { DbUserImportJobData } from '../types.js';

// 展開後のサイズ上限
const MAX_META_JSON_SIZE = 64 * 1024 * 1024; // 64MB
const MAX_EMOJI_FILE_SIZE = 32 * 1024 * 1024; // 32MB

// ファイルシステムのファイル名長上限
const MAX_NAME_LENGTH = 255;

// meta.json 中のファイル名: 英数字と _ からなる名前 + 任意の拡張子部 ('.' 以降は英数字と '.')
const FILE_NAME_PATTERN = /^[a-zA-Z0-9_]+(\.[a-zA-Z0-9]+)*$/;
// meta.json 中の絵文字名: 英数字と _ からなる名前
const EMOJI_NAME_PATTERN = /^[a-zA-Z0-9_]+$/;

// meta.json の emojis 配列の要素 (ExportCustomEmojisProcessorService が出力する形式)
type EmojiRecord = {
	fileName: string;
	downloaded: boolean;
	emoji: {
		name: string;
		category: string | null;
		aliases: string[];
		license: string | null;
		isSensitive: boolean;
		localOnly: boolean;
	};
};

function isValidName(value: unknown, pattern: RegExp): value is string {
	return typeof value === 'string' && value.length <= MAX_NAME_LENGTH && pattern.test(value);
}

// ログが長くなるのを防ぐ
function truncateForLog(value: unknown): string {
	const text = typeof value === 'string' ? value : JSON.stringify(value) ?? String(value);
	return text.length > MAX_NAME_LENGTH ? text.slice(0, MAX_NAME_LENGTH) + '...' : text;
}

// TODO: 名前衝突時の動作を選べるようにする
@Injectable()
export class ImportCustomEmojisProcessorService {
	private logger: Logger;

	constructor(
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

	@bindThis
	public async process(job: Bull.Job<DbUserImportJobData>): Promise<void> {
		this.logger.info('Importing custom emojis ...');

		const file = await this.driveFilesRepository.findOneBy({
			id: job.data.fileId,
		});
		if (file == null) {
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
		try {
			this.logger.succ(`Unzipping to ${outputPath}`);
			await fs.promises.mkdir(outputPath);

			// 一括展開せず、meta.json で参照されているエントリだけを検証しながら1つずつ書き出す
			const zip = await ZipFile.open(destPath);
			try {
				// 1. meta.json だけを取り出す
				const metaPath = outputPath + '/meta.json';
				let metaFound = false;
				for await (const entry of zip.entries()) {
					if (entry.filename !== 'meta.json') continue;
					await zip.extractToFile(entry, metaPath, { maxBytes: MAX_META_JSON_SIZE });
					metaFound = true;
				}
				if (!metaFound) {
					throw new Error('meta.json not found in the archive');
				}
				const metaRaw = await fs.promises.readFile(metaPath, 'utf-8');
				const meta = JSON.parse(metaRaw);

				// 取り込むべきファイル名 → それを参照するレコード
				const wanted = new Map<string, EmojiRecord[]>();
				for (const record of meta.emojis as EmojiRecord[]) {
					if (!record.downloaded) continue;
					if (!isValidName(record.fileName, FILE_NAME_PATTERN)) {
						this.logger.error(`invalid filename: ${truncateForLog(record.fileName)}`);
						continue;
					}
					if (!isValidName(record.emoji?.name, EMOJI_NAME_PATTERN)) {
						this.logger.error(`invalid emojiname: ${truncateForLog(record.emoji?.name)}`);
						continue;
					}
					const records = wanted.get(record.fileName);
					if (records == null) {
						wanted.set(record.fileName, [record]);
					} else {
						records.push(record);
					}
				}

				// 2. meta.json で参照されているエントリだけを ZIP 内の順序で展開して取り込む
				for await (const entry of zip.entries()) {
					const records = wanted.get(entry.filename);
					if (records == null) continue;
					wanted.delete(entry.filename);

					const emojiPath = outputPath + '/' + entry.filename;
					try {
						await zip.extractToFile(entry, emojiPath, { maxBytes: MAX_EMOJI_FILE_SIZE });
					} catch (e) {
						if (e instanceof Error || typeof e === 'string') {
							this.logger.error(`couldn't extract ${entry.filename}: ${e}`);
						}
						continue;
					}

					try {
						for (const record of records) {
							await this.importEmoji(record, emojiPath);
						}
					} finally {
						// ドライブへ取り込み済みなので、都度削除する
						await fs.promises.rm(emojiPath, { force: true });
					}
				}

				for (const fileName of wanted.keys()) {
					this.logger.error(`file not found in the archive: ${fileName}`);
				}
			} finally {
				await zip.close();
			}

			cleanup();

			this.logger.succ('Imported');
		} catch (e) {
			if (e instanceof Error || typeof e === 'string') {
				this.logger.error(e);
			}
			cleanup();
			throw e;
		}
	}

	@bindThis
	private async importEmoji(record: EmojiRecord, emojiPath: string): Promise<void> {
		const emojiInfo = record.emoji;
		try {
			await this.emojisRepository.delete({
				name: emojiInfo.name,
				host: IsNull(),
			});

			const driveFile = await this.driveService.addFile({
				user: null,
				path: emojiPath,
				name: record.fileName,
				force: true,
			});
			await this.customEmojiService.add({
				originalUrl: driveFile.url,
				publicUrl: driveFile.webpublicUrl ?? driveFile.url,
				fileType: driveFile.webpublicType ?? driveFile.type,
				name: emojiInfo.name,
				category: emojiInfo.category,
				host: null,
				aliases: emojiInfo.aliases,
				license: emojiInfo.license,
				isSensitive: emojiInfo.isSensitive,
				localOnly: emojiInfo.localOnly,
				roleIdsThatCanBeUsedThisEmojiAsReaction: [],
			});
		} catch (e) {
			if (e instanceof Error || typeof e === 'string') {
				this.logger.error(`couldn't import ${emojiPath} for ${emojiInfo.name}: ${e}`);
			}
		}
	}
}
