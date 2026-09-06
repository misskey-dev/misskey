/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import sharp from 'sharp';
import { Decoder, Demuxer, Scaler } from 'node-av/api';
import { AVSEEK_FLAG_BACKWARD } from 'node-av/constants';
import { DI } from '@/di-symbols.js';
import type { Config } from '@/config.js';
import { ImageProcessingService } from '@/core/ImageProcessingService.js';
import type { IImage } from '@/core/ImageProcessingService.js';
import { bindThis } from '@/decorators.js';
import { appendQuery, query } from '@/misc/prelude/url.js';
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

		await using demuxer = await Demuxer.open(source, { signal });

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

		using decoder = await Decoder.create(videoStream, { signal });
		using scaler = new Scaler();

		for await (using frame of decoder.frames(demuxer.packets(videoStream.index))) {
			if (frame == null) continue;

			const png = await scaler.toPng(frame);
			return await this.imageProcessingService.convertSharpToWebp(sharp(png), 498, 422);
		}

		throw new Error(`Could not decode any frame: ${source}`);
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

