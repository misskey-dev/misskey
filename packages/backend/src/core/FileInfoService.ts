/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as fs from 'node:fs';
import * as crypto from 'node:crypto';
import { join } from 'node:path';
import * as stream from 'node:stream/promises';
import { Injectable } from '@nestjs/common';
import { FSWatcher } from 'chokidar';
import * as fileType from 'file-type';
import FFmpeg from 'fluent-ffmpeg';
import isSvg from 'is-svg';
import probeImageSize from 'probe-image-size';
import { sharpBmp } from '@misskey-dev/sharp-read-bmp';
import * as blurhash from 'blurhash';
import { createTempDir } from '@/misc/create-temp.js';
import { AiService } from '@/core/AiService.js';
import { LoggerService } from '@/core/LoggerService.js';
import type Logger from '@/logger.js';
import { bindThis } from '@/decorators.js';
import type { PredictionType } from 'nsfwjs';

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
		skipSensitiveDetection: boolean;
		sensitiveThreshold?: number;
		sensitiveThresholdForPorn?: number;
		enableSensitiveMediaDetectionForVideos?: boolean;
	}): Promise<FileInfo> {
		const warnings = [] as string[];

		const size = await this.getFileSize(path);
		const md5 = await this.calcHash(path);

		let type = await this.detectType(path);

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

		if (!opts.skipSensitiveDetection) {
			await this.detectSensitivity(
				path,
				type.mime,
				opts.sensitiveThreshold ?? 0.5,
				opts.sensitiveThresholdForPorn ?? 0.75,
				opts.enableSensitiveMediaDetectionForVideos ?? false,
			).then(value => {
				[sensitive, porn] = value;
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
	private async detectSensitivity(source: string, mime: string, sensitiveThreshold: number, sensitiveThresholdForPorn: number, analyzeVideo: boolean): Promise<[sensitive: boolean, porn: boolean]> {
		let sensitive = false;
		let porn = false;

		function judgePrediction(result: readonly PredictionType[]): [sensitive: boolean, porn: boolean] {
			let sensitive = false;
			let porn = false;

			if ((result.find(x => x.className === 'Sexy')?.probability ?? 0) > sensitiveThreshold) sensitive = true;
			if ((result.find(x => x.className === 'Hentai')?.probability ?? 0) > sensitiveThreshold) sensitive = true;
			if ((result.find(x => x.className === 'Porn')?.probability ?? 0) > sensitiveThreshold) sensitive = true;

			if ((result.find(x => x.className === 'Porn')?.probability ?? 0) > sensitiveThresholdForPorn) porn = true;

			return [sensitive, porn];
		}

		if ([
			'image/jpeg',
			'image/png',
			'image/webp',
		].includes(mime)) {
			const result = await this.aiService.detectSensitive(source);
			if (result) {
				[sensitive, porn] = judgePrediction(result);
			}
		} else if (analyzeVideo && (mime === 'image/apng' || mime.startsWith('video/'))) {
			const [outDir, disposeOutDir] = await createTempDir();
			try {
				const command = FFmpeg()
					.input(source)
					.inputOptions([
						'-skip_frame', 'nokey', // 可能ならキーフレームのみを取得してほしいとする（そうなるとは限らない）
						'-lowres', '3', // 元の画質でデコードする必要はないので 1/8 画質でデコードしてもよいとする（そうなるとは限らない）
					])
					.noAudio()
					.videoFilters([
						{
							filter: 'select', // フレームのフィルタリング
							options: {
								e: 'eq(pict_type,PICT_TYPE_I)', // I-Frame のみをフィルタする（VP9 とかはデコードしてみないとわからないっぽい）
							},
						},
						{
							filter: 'blackframe', // 暗いフレームの検出
							options: {
								amount: '0', // 暗さに関わらず全てのフレームで測定値を取る
							},
						},
						{
							filter: 'metadata',
							options: {
								mode: 'select', // フレーム選択モード
								key: 'lavfi.blackframe.pblack', // フレームにおける暗部の百分率（前のフィルタからのメタデータを参照する）
								value: '50',
								function: 'less', // 50% 未満のフレームを選択する（50% 以上暗部があるフレームだと誤検知を招くかもしれないので）
							},
						},
						{
							filter: 'scale',
							options: {
								w: 299,
								h: 299,
							},
						},
					])
					.format('image2')
					.output(join(outDir, '%d.png'))
					.outputOptions(['-vsync', '0']); // 可変フレームレートにすることで穴埋めをさせない
				const results: ReturnType<typeof judgePrediction>[] = [];
				let frameIndex = 0;
				let targetIndex = 0;
				let nextIndex = 1;
				for await (const path of this.asyncIterateFrames(outDir, command)) {
					try {
						const index = frameIndex++;
						if (index !== targetIndex) {
							continue;
						}
						targetIndex = nextIndex;
						nextIndex += index; // fibonacci sequence によってフレーム数制限を掛ける
						const result = await this.aiService.detectSensitive(path);
						if (result) {
							results.push(judgePrediction(result));
						}
					} finally {
						fs.promises.unlink(path);
					}
				}
				sensitive = results.filter(x => x[0]).length >= Math.ceil(results.length * sensitiveThreshold);
				porn = results.filter(x => x[1]).length >= Math.ceil(results.length * sensitiveThresholdForPorn);
			} finally {
				disposeOutDir();
			}
		}

		return [sensitive, porn];
	}

	private async *asyncIterateFrames(cwd: string, command: FFmpeg.FfmpegCommand): AsyncGenerator<string, void> {
		const watcher = new FSWatcher({
			cwd,
			disableGlobbing: true,
		});
		let finished = false;
		command.once('end', () => {
			finished = true;
			watcher.close();
		});
		command.run();
		for (let i = 1; true; i++) { // eslint-disable-line @typescript-eslint/no-unnecessary-condition
			const current = `${i}.png`;
			const next = `${i + 1}.png`;
			const framePath = join(cwd, current);
			if (await this.exists(join(cwd, next))) {
				yield framePath;
			} else if (!finished) { // eslint-disable-line @typescript-eslint/no-unnecessary-condition
				watcher.add(next);
				await new Promise<void>((resolve, reject) => {
					watcher.on('add', function onAdd(path) {
						if (path === next) { // 次フレームの書き出しが始まっているなら、現在フレームの書き出しは終わっている
							watcher.unwatch(current);
							watcher.off('add', onAdd);
							resolve();
						}
					});
					command.once('end', resolve); // 全てのフレームを処理し終わったなら、最終フレームである現在フレームの書き出しは終わっている
					command.once('error', reject);
				});
				yield framePath;
			} else if (await this.exists(framePath)) {
				yield framePath;
			} else {
				return;
			}
		}
	}

	@bindThis
	private exists(path: string): Promise<boolean> {
		return fs.promises.access(path).then(() => true, () => false);
	}

	@bindThis
	public fixMime(mime: string | fileType.MimeType): string {
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
