/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import sharp from 'sharp';
import { Decoder, Demuxer, FilterAPI, Scaler } from 'node-av/api';
import { AVSEEK_FLAG_BACKWARD } from 'node-av/constants';
import type { Frame } from 'node-av/lib';
import { DI } from '@/di-symbols.js';
import type { Config } from '@/config.js';
import { ImageProcessingService } from '@/core/ImageProcessingService.js';
import type { IImage } from '@/core/ImageProcessingService.js';
import { bindThis } from '@/decorators.js';
import { appendQuery, query } from '@/misc/prelude/url.js';
import { getAutorotateFilter, localInputOptions } from '@/misc/node-av-input.js';
import '@/misc/node-av-log.js';

/**
 * サムネイル生成全体の制限時間。
 * 壊れたファイルや極端に大きなファイルでデコードが張り付くのを防ぐ。
 */
const THUMBNAIL_TIMEOUT_MS = 30 * 1000;

/** サムネイルとして切り出す位置 (動画全体に対する割合) */
const THUMBNAIL_POSITION_RATIO = 0.05;

@Injectable()
export class VideoProcessingService {
	constructor(
		@Inject(DI.config)
		private config: Config,

		private imageProcessingService: ImageProcessingService,
	) {
	}

	@bindThis
	public async generateVideoThumbnail(source: string): Promise<IImage> {
		const signal = AbortSignal.timeout(THUMBNAIL_TIMEOUT_MS);

		await using demuxer = await Demuxer.open(source, { signal, options: localInputOptions });

		const videoStream = demuxer.video();
		if (videoStream == null) {
			throw new Error(`No video stream found: ${source}`);
		}

		// 冒頭は暗転やロゴであることが多いので、少し進んだ位置のキーフレームを狙う。
		// 尺が取得できないコンテナもあるため、その場合は先頭から読む。
		if (demuxer.duration > 0) {
			// streamIndex を指定すると timestamp がそのストリームの time base として解釈されてしまうため、
			// 秒で指定できる全体シーク (-1) を使う
			await demuxer.seek(demuxer.duration * THUMBNAIL_POSITION_RATIO, -1, AVSEEK_FLAG_BACKWARD);
		}

		using decoder = await Decoder.create(videoStream, {
			signal,
			// 1 フレームしか取り出さないため、フレームスレッドは最初の出力までの遅延と
			// スレッドごとのフレームバッファによるメモリ消費を増やすだけになる
			threadCount: 1,
		});
		// 回転メタデータに従って向きを直す
		const rotation = getAutorotateFilter(videoStream);
		using rotator = rotation != null ? FilterAPI.create(rotation, { signal }) : null;
		using scaler = new Scaler();

		for await (using decoded of decoder.frames(demuxer.packets(videoStream.index))) {
			if (decoded == null) continue;

			if (rotator == null) {
				return await this.frameToWebp(scaler, decoded);
			}
			for await (using rotated of rotator.frames(decoded)) {
				if (rotated == null) continue;
				return await this.frameToWebp(scaler, rotated);
			}
		}

		throw new Error(`Could not decode any frame: ${source}`);
	}

	/**
	 * デコード済みフレームをサムネイル用の WebP に変換する
	 */
	@bindThis
	private async frameToWebp(scaler: Scaler, frame: Frame): Promise<IImage> {
		const { width, height } = frame;
		const pixels = await scaler.toBuffer(frame, { format: 'rgb' });
		const image = sharp(pixels, { raw: { width, height, channels: 3 } });
		return await this.imageProcessingService.convertSharpToWebp(image, 498, 422);
	}

	@bindThis
	public getExternalVideoThumbnailUrl(url: string): string | null {
		if (this.config.videoThumbnailGenerator == null) return null;

		return appendQuery(
			`${this.config.videoThumbnailGenerator}/thumbnail.webp`,
			query({
				thumbnail: '1',
				url,
			}),
		);
	}
}

