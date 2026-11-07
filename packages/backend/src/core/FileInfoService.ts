/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as fs from 'node:fs';
import * as crypto from 'node:crypto';
import * as stream from 'node:stream/promises';
import { Injectable } from '@nestjs/common';
import * as fileType from 'file-type';
import isSvg from 'is-svg';
import probeImageSize from 'probe-image-size';
import { sharpBmp } from '@misskey-dev/sharp-read-bmp';
import * as blurhash from 'blurhash';
import { Decoder, Demuxer, FilterAPI, Scaler, probe } from 'node-av/api';
import { AV_PICTURE_TYPE_I } from 'node-av/constants';
import { SensitiveMediaDetectionService } from '@/core/SensitiveMediaDetectionService.js';
import { LoggerService } from '@/core/LoggerService.js';
import type Logger from '@/logger.js';
import { bindThis } from '@/decorators.js';
import { isMimeImage } from '@/misc/is-mime-image.js';
import type { Prediction } from '@/core/SensitiveMediaDetectionService.js';
import '@/misc/node-av-log.js';

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

/** 映像トラックの有無を調べる probe の制限時間 */
const PROBE_TIMEOUT_MS = 10 * 1000;

/**
 * センシティブ判定用のフレーム抽出全体の制限時間。
 * 長尺・高解像度の動画でデコードが延々と続くのを防ぐ。
 * 時間切れになった場合は、そこまでに集まったフレームだけで判定する。
 */
const FRAME_EXTRACTION_TIMEOUT_MS = 60 * 1000;

/** 判定対象から除外する暗部の割合 (これ以上暗いフレームは誤検知を招くため使わない) */
const MAX_BLACK_PERCENTAGE = 50;

/** 判定サービス側のデコーダが内部で使う画像サイズ */
const DETECTION_IMAGE_SIZE = 299;

function isAbortError(err: unknown): boolean {
	return err instanceof Error && (err.name === 'TimeoutError' || err.name === 'AbortError');
}

@Injectable()
export class FileInfoService {
	private logger: Logger;

	constructor(
		private sensitiveMediaDetectionService: SensitiveMediaDetectionService,
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
		sensitiveThreshold?: number;
		sensitiveThresholdForPorn?: number;
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

		function judgePrediction(result: readonly Prediction[]): [sensitive: boolean, porn: boolean] {
			let sensitive = false;
			let porn = false;

			if ((result.find(x => x.className === 'Sexy')?.probability ?? 0) > sensitiveThreshold) sensitive = true;
			if ((result.find(x => x.className === 'Hentai')?.probability ?? 0) > sensitiveThreshold) sensitive = true;
			if ((result.find(x => x.className === 'Porn')?.probability ?? 0) > sensitiveThreshold) sensitive = true;

			if ((result.find(x => x.className === 'Porn')?.probability ?? 0) > sensitiveThresholdForPorn) porn = true;

			return [sensitive, porn];
		}

		if (analyzeVideo && (mime === 'image/apng' || mime.startsWith('video/'))) {
			// 判定対象フレームを選定して正規化済みバッファとして集め、外部サービスへまとめて送る。
			const frameBuffers = await this.extractFramesForDetection(source);
			const predictions = await this.sensitiveMediaDetectionService.detectSensitiveMany(frameBuffers);
			const results = predictions.filter((x): x is Prediction[] => x != null).map(x => judgePrediction(x));
			// 判定に成功したフレームが 0 件のとき（接続先未設定・通信失敗等）は、
			// Math.ceil(0) との比較が 0 >= 0 で真になり全動画がセンシティブ扱いになってしまうため、
			// 1 件以上判定できたときのみ集約する（失敗時は非センシティブ扱い: misskey-dev/misskey#16804）。
			if (results.length > 0) {
				sensitive = results.filter(x => x[0]).length >= Math.ceil(results.length * sensitiveThreshold);
				porn = results.filter(x => x[1]).length >= Math.ceil(results.length * sensitiveThresholdForPorn);
			}
		} else if (isMimeImage(mime, 'sharp-convertible-image-with-bmp')) {
			/*
			 * 判定サービス側のデコーダは限られた画像形式しか受け付けないため、sharp で PNG に変換する
			 * せっかくなので内部処理で使われる最大サイズの299x299に事前にリサイズする
			 */
			const png = await (await sharpBmp(source, mime))
				.resize(299, 299, {
					withoutEnlargement: false,
				})
				.rotate()
				.flatten({ background: { r: 119, g: 119, b: 119 } }) // 透過部分を18%グレーで塗りつぶす
				.png()
				.toBuffer();
			const result = await this.sensitiveMediaDetectionService.detectSensitive(png);
			if (result) {
				[sensitive, porn] = judgePrediction(result);
			}
		}

		return [sensitive, porn];
	}

	/**
	 * センシティブ判定に掛けるフレームを、正規化済みの PNG バッファとして抽出する。
	 *
	 * 制限時間を超えた場合はそこまでに集まった分を返す。フレームが 1 枚も取れなくても
	 * 呼び出し元の「判定成功 0 件なら非センシティブ」の扱いに落ちるため、例外にはしない。
	 *
	 * @param source ファイルパス
	 * @returns 299x299 に正規化された PNG バッファの配列
	 */
	@bindThis
	private async extractFramesForDetection(source: string): Promise<Buffer[]> {
		const signal = AbortSignal.timeout(FRAME_EXTRACTION_TIMEOUT_MS);
		const frameBuffers: Buffer[] = [];

		try {
			await using demuxer = await Demuxer.open(source, { signal });

			const videoStream = demuxer.video();
			if (videoStream == null) return frameBuffers;

			using decoder = await Decoder.create(videoStream, {
				signal,
				options: {
					'skip_frame': 'nokey', // 可能ならキーフレームのみを取得してほしいとする（そうなるとは限らない）
					'lowres': '3', // 元の画質でデコードする必要はないので 1/8 画質でデコードしてもよいとする（そうなるとは限らない）
				},
			});
			// 暗さに関わらず全てのフレームで測定値を取り、lavfi.blackframe.pblack として受け取る
			using filter = FilterAPI.create('blackframe=amount=0', { signal });
			using scaler = new Scaler();

			let frameIndex = 0;
			let targetIndex = 0;
			let nextIndex = 1;

			for await (using frame of decoder.frames(demuxer.packets(videoStream.index))) {
				// I-Frame のみを対象にする（VP9 とかはデコードしてみないとわからないっぽい）
				if (frame == null || frame.pictType !== AV_PICTURE_TYPE_I) continue;

				for await (using measured of filter.frames(frame)) {
					if (measured == null) continue;

					// フレームにおける暗部の百分率。取得できなかったフレームは判定に使わない
					// （Number(null) が 0 になり、真っ暗なフレームを通してしまうため明示的に弾く）
					const pblack = measured.getMetadata().get('lavfi.blackframe.pblack');
					if (pblack == null || !(Number(pblack) < MAX_BLACK_PERCENTAGE)) continue;

					const index = frameIndex++;
					if (index !== targetIndex) continue;
					const following = targetIndex + nextIndex;
					targetIndex = nextIndex;
					nextIndex = Math.max(following, targetIndex + 1);

					frameBuffers.push(await scaler.toPng(measured, {
						resize: { width: DETECTION_IMAGE_SIZE, height: DETECTION_IMAGE_SIZE },
					}));
				}
			}
		} catch (err) {
			// 時間切れは想定内。集まった分だけで判定を続ける
			if (!isAbortError(err)) throw err;
			this.logger.warn(`Frame extraction timed out after ${FRAME_EXTRACTION_TIMEOUT_MS}ms, using ${frameBuffers.length} frame(s). File path: ${source}`);
		}

		return frameBuffers;
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
	private async hasVideoTrackOnVideoFile(path: string): Promise<boolean> {
		const sublogger = this.logger.createSubLogger('probe');
		sublogger.info(`Checking the video file. File path: ${path}`);
		try {
			const result = await probe(path, { signal: AbortSignal.timeout(PROBE_TIMEOUT_MS) });
			return result.streams.some((stream) => stream.type === 'video');
		} catch (err) {
			const reason = isAbortError(err) ? `Timed out after ${PROBE_TIMEOUT_MS}ms` : 'Could not check the video file';
			sublogger.warn(`${reason}. Returns true. File path: ${path}`, err as Error);
			return true;
		}
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
	private async getBlurhash(path: string, type: string): Promise<string> {
		const sharp = await sharpBmp(path, type);
		const { data: buffer, info } = await sharp
			.raw()
			.ensureAlpha()
			.resize(64, 64, { fit: 'inside' })
			.toBuffer({ resolveWithObject: true });
		return blurhash.encode(new Uint8ClampedArray(buffer), info.width, info.height, 5, 5);
	}
}
