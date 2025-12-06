/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as fs from 'node:fs';
import * as crypto from 'node:crypto';
import * as stream from 'node:stream/promises';
import { Injectable } from '@nestjs/common';
import * as fileType from 'file-type';
import FFmpeg from 'fluent-ffmpeg';
import isSvg from 'is-svg';
import probeImageSize from 'probe-image-size';
import { sharpBmp } from '@misskey-dev/sharp-read-bmp';
import * as blurhash from 'blurhash';
import { AiService } from '@/core/AiService.js';
import { LoggerService } from '@/core/LoggerService.js';
import type Logger from '@/logger.js';
import { bindThis } from '@/decorators.js';

export type FileInfo = {
	size: number;
	md5: string;
	type: {
		mime: string;
		ext: string | null;
	};
	width?: number;
	height?: number;
	orientation?: number;
	blurhash?: string;
	sensitive: boolean;
	porn: boolean;
	warnings: string[];
};

const TYPE_OCTET_STREAM = {
	mime: 'application/octet-stream',
	ext: null,
};

const TYPE_SVG = {
	mime: 'image/svg+xml',
	ext: 'svg',
};

@Injectable()
export class FileInfoService {
	private logger: Logger;

	constructor(
		private aiService: AiService,
		private loggerService: LoggerService,
	) {
		this.logger = this.loggerService.getLogger('file-info');
	}

	/**
	 * Get file information
	 */
	@bindThis
	public async getFileInfo(path: string, opts: {
		fileName?: string | null;
		skipSensitiveDetection: boolean;
		enableSensitiveMediaDetectionForVideos?: boolean;
	}): Promise<FileInfo> {
		const warnings = [] as string[];

		const size = await this.getFileSize(path);
		const md5 = await this.calcHash(path);

		let type = await this.detectType(path);

		if (type.mime === TYPE_OCTET_STREAM.mime && opts.fileName != null) {
			const ext = opts.fileName.split('.').pop();
			if (ext === 'txt') {
				type = {
					mime: 'text/plain',
					ext: 'txt',
				};
			} else if (ext === 'csv') {
				type = {
					mime: 'text/csv',
					ext: 'csv',
				};
			} else if (ext === 'json') {
				type = {
					mime: 'application/json',
					ext: 'json',
				};
			}
		}

		// image dimensions
		let width: number | undefined;
		let height: number | undefined;
		let orientation: number | undefined;

		if ([
			'image/png',
			'image/gif',
			'image/jpeg',
			'image/webp',
			'image/avif',
			'image/apng',
			'image/bmp',
			'image/tiff',
			'image/svg+xml',
			'image/vnd.adobe.photoshop',
		].includes(type.mime)) {
			const imageSize = await this.detectImageSize(path).catch(e => {
				warnings.push(`detectImageSize failed: ${e}`);
				return undefined;
			});

			// うまく判定できない画像は octet-stream にする
			if (!imageSize) {
				warnings.push('cannot detect image dimensions');
				type = TYPE_OCTET_STREAM;
			} else if (imageSize.wUnits === 'px') {
				width = imageSize.width;
				height = imageSize.height;
				orientation = imageSize.orientation;

				// 制限を超えている画像は octet-stream にする
				if (imageSize.width > 16383 || imageSize.height > 16383) {
					warnings.push('image dimensions exceeds limits');
					type = TYPE_OCTET_STREAM;
				}
			} else {
				warnings.push(`unsupported unit type: ${imageSize.wUnits}`);
			}
		}

		let blurhash: string | undefined;

		if ([
			'image/jpeg',
			'image/gif',
			'image/png',
			'image/apng',
			'image/webp',
			'image/avif',
			'image/svg+xml',
		].includes(type.mime)) {
			blurhash = await this.getBlurhash(path, type.mime).catch(e => {
				warnings.push(`getBlurhash failed: ${e}`);
				return undefined;
			});
		}

		let sensitive = false;
		let porn = false;

		if (
			!opts.skipSensitiveDetection && (
				((type.mime === 'image/apng' || type.mime.startsWith('video/')) && opts.enableSensitiveMediaDetectionForVideos) ||
				(type.mime.startsWith('image/') && type.mime !== 'image/apng')
			)
		) {
			await this.aiService.detectSensitivity(
				path,
				type.mime,
			).then(value => {
				if (value != null) {
					sensitive = value.sensitive;
					porn = value.porn;
				}
			}, error => {
				warnings.push(`detectSensitivity failed: ${error}`);
			});
		}

		return {
			size,
			md5,
			type,
			width,
			height,
			orientation,
			blurhash,
			sensitive,
			porn,
			warnings,
		};
	}

	@bindThis
	public fixMime(mime: string): string {
		// see https://github.com/misskey-dev/misskey/pull/10686
		if (mime === 'audio/x-flac') {
			return 'audio/flac';
		}
		if (mime === 'audio/vnd.wave') {
			return 'audio/wav';
		}

		return mime;
	}

	/**
	 * ビデオファイルにビデオトラックがあるかどうかチェック
	 * （ない場合：m4a, webmなど）
	 *
	 * @param path ファイルパス
	 * @returns ビデオトラックがあるかどうか（エラー発生時は常に`true`を返す）
	 */
	@bindThis
	private hasVideoTrackOnVideoFile(path: string): Promise<boolean> {
		const sublogger = this.logger.createSubLogger('ffprobe');
		sublogger.info(`Checking the video file. File path: ${path}`);
		return new Promise((resolve) => {
			try {
				FFmpeg.ffprobe(path, (err, metadata) => {
					if (err) {
						sublogger.warn(`Could not check the video file. Returns true. File path: ${path}`, err);
						resolve(true);
						return;
					}
					resolve(metadata.streams.some((stream) => stream.codec_type === 'video'));
				});
			} catch (err) {
				sublogger.warn(`Could not check the video file. Returns true. File path: ${path}`, err as Error);
				resolve(true);
			}
		});
	}

	/**
	 * Detect MIME Type and extension
	 */
	@bindThis
	public async detectType(path: string): Promise<{
		mime: string;
		ext: string | null;
	}> {
	// Check 0 byte
		const fileSize = await this.getFileSize(path);
		if (fileSize === 0) {
			return TYPE_OCTET_STREAM;
		}

		const type = await fileType.fileTypeFromFile(path);

		if (type) {
		// XMLはSVGかもしれない
			if (type.mime === 'application/xml' && await this.checkSvg(path)) {
				return TYPE_SVG;
			}

			if ((type.mime.startsWith('video') || type.mime === 'application/ogg') && !(await this.hasVideoTrackOnVideoFile(path))) {
				const newMime = `audio/${type.mime.split('/')[1]}`;
				if (newMime === 'audio/mp4') {
					return {
						mime: 'audio/mp4',
						ext: 'm4a',
					};
				}
				return {
					mime: newMime,
					ext: type.ext,
				};
			}

			return {
				mime: this.fixMime(type.mime),
				ext: type.ext,
			};
		}

		// 種類が不明でもSVGかもしれない
		if (await this.checkSvg(path)) {
			return TYPE_SVG;
		}

		// それでも種類が不明なら application/octet-stream にする
		return TYPE_OCTET_STREAM;
	}

	/**
	 * Check the file is SVG or not
	 */
	@bindThis
	public async checkSvg(path: string): Promise<boolean> {
		try {
			const size = await this.getFileSize(path);
			if (size > 1 * 1024 * 1024) return false;
			const buffer = await fs.promises.readFile(path);
			return isSvg(buffer.toString());
		} catch {
			return false;
		}
	}

	/**
	 * Get file size
	 */
	@bindThis
	public async getFileSize(path: string): Promise<number> {
		return (await fs.promises.stat(path)).size;
	}

	/**
	 * Calculate MD5 hash
	 */
	@bindThis
	private async calcHash(path: string): Promise<string> {
		const hash = crypto.createHash('md5').setEncoding('hex');
		await stream.pipeline(fs.createReadStream(path), hash);
		return hash.read();
	}

	/**
	 * Detect dimensions of image
	 */
	@bindThis
	private async detectImageSize(path: string): Promise<{
		width: number;
		height: number;
		wUnits: string;
		hUnits: string;
		orientation?: number;
	}> {
		const readable = fs.createReadStream(path);
		const imageSize = await probeImageSize(readable);
		readable.destroy();
		return imageSize;
	}

	/**
	 * Calculate blurhash string of image
	 */
	@bindThis
	private getBlurhash(path: string, type: string): Promise<string> {
		return new Promise(async (resolve, reject) => {
			(await sharpBmp(path, type))
				.raw()
				.ensureAlpha()
				.resize(64, 64, { fit: 'inside' })
				.toBuffer((err, buffer, info) => {
					if (err) return reject(err);

					let hash;

					try {
						hash = blurhash.encode(new Uint8ClampedArray(buffer), info.width, info.height, 5, 5);
					} catch (e) {
						return reject(e);
					}

					resolve(hash);
				});
		});
	}
}
