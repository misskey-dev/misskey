/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as fs from 'node:fs';
import type { DriveFilesRepository, MiDriveFile } from '@/models/_.js';
import { createTemp } from '@/misc/create-temp.js';
import type { DownloadService } from '@/core/DownloadService.js';
import type { FileInfoService } from '@/core/FileInfoService.js';
import type { InternalStorageService } from '@/core/InternalStorageService.js';

export type DownloadedFileResult = {
	kind: 'downloaded';
	mime: string;
	ext: string | null;
	path: string;
	cleanup: () => void;
	filename: string;
};

export type FileResolveResult =
	| { kind: 'not-found' }
	| { kind: 'unavailable' }
	| {
		kind: 'stored';
		fileRole: 'thumbnail' | 'webpublic' | 'original';
		file: MiDriveFile;
		filename: string;
		mime: string;
		ext: string | null;
		path: string;
	}
	| {
		kind: 'remote';
		fileRole: 'thumbnail' | 'webpublic' | 'original';
		file: MiDriveFile;
		filename: string;
		url: string;
		mime: string;
		ext: string | null;
		path: string;
		cleanup: () => void;
	};

export class FileServerFileResolver {
	constructor(
		private driveFilesRepository: DriveFilesRepository,
		private fileInfoService: FileInfoService,
		private downloadService: DownloadService,
		private internalStorageService: InternalStorageService,
	) {}

	public async downloadAndDetectTypeFromUrl(url: string): Promise<DownloadedFileResult> {
		const [path, cleanup] = await createTemp();
		try {
			const { filename } = await this.downloadService.downloadUrl(url, path);

			const { mime, ext } = await this.fileInfoService.detectType(path);

			return {
				kind: 'downloaded',
				mime, ext,
				path, cleanup,
				filename,
			};
		} catch (e) {
			cleanup();
			throw e;
		}
	}

	public async resolveFileByAccessKey(key: string): Promise<FileResolveResult> {
		// Fetch drive file
		const file = await this.driveFilesRepository.createQueryBuilder('file')
			.where('file.accessKey = :accessKey', { accessKey: key })
			.orWhere('file.thumbnailAccessKey = :thumbnailAccessKey', { thumbnailAccessKey: key })
			.orWhere('file.webpublicAccessKey = :webpublicAccessKey', { webpublicAccessKey: key })
			.getOne();

		if (file == null) return { kind: 'not-found' };

		const isThumbnail = file.thumbnailAccessKey === key;
		const isWebpublic = file.webpublicAccessKey === key;

		if (!file.storedInternal) {
			if (!(file.isLink && file.uri)) return { kind: 'unavailable' };
			const result = await this.downloadAndDetectTypeFromUrl(file.uri);
			const { kind: _kind, ...downloaded } = result;
			file.size = (await fs.promises.stat(downloaded.path)).size;	// DB file.sizeは正確とは限らないので
			return {
				kind: 'remote',
				...downloaded,
				url: file.uri,
				fileRole: isThumbnail ? 'thumbnail' : isWebpublic ? 'webpublic' : 'original',
				file,
				filename: file.name,
			};
		}

		const path = this.internalStorageService.resolvePath(key);

		if (isThumbnail || isWebpublic) {
			const { mime, ext } = await this.fileInfoService.detectType(path);
			return {
				kind: 'stored',
				fileRole: isThumbnail ? 'thumbnail' : 'webpublic',
				file,
				filename: file.name,
				mime, ext,
				path,
			};
		}

		return {
			kind: 'stored',
			fileRole: 'original',
			file,
			filename: file.name,
			// 古いファイルは修正前のmimeを持っているのでできるだけ修正してあげる
			mime: this.fileInfoService.fixMime(file.type),
			ext: null,
			path,
		};
	}
}
