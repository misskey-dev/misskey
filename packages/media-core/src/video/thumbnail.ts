/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import FFmpeg from 'fluent-ffmpeg';
import { createTempDir } from '../common/temp.js';
import { convertToWebp } from '../image/image.js';
import type { IImage } from '../image/image.js';

/**
 * 動画のサムネイルを WebP で生成する (ffmpeg が必要)
 *
 * 再生時間の 5% の位置のフレームを 498x422 に収まるように縮小する
 */
export async function generateVideoThumbnail(source: string): Promise<IImage> {
	const [dir, cleanup] = await createTempDir();

	try {
		await new Promise((res, rej) => {
			FFmpeg({
				source,
			})
				.on('end', res)
				.on('error', rej)
				.screenshot({
					folder: dir,
					filename: 'out.png',	// must have .png extension
					count: 1,
					timestamps: ['5%'],
				});
		});

		return await convertToWebp(`${dir}/out.png`, 498, 422);
	} finally {
		cleanup();
	}
}
