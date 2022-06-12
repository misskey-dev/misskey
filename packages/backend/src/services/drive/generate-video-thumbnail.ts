import * as fs from 'node:fs';
import * as path from 'node:path';
import { createTemp } from '@/misc/create-temp.js';
import { IImage, convertToJpeg } from './image-processor.js';
import FFmpeg from 'fluent-ffmpeg';

export async function GenerateVideoThumbnail(source: string): Promise<IImage> {
	const [file, cleanup] = await createTemp();
	const parsed = path.parse(file);

	try {
		await new Promise((res, rej) => {
			FFmpeg({
				source,
			})
			.on('end', res)
			.on('error', rej)
			.screenshot({
				folder: parsed.dir,
				filename: parsed.base,
				count: 1,
				timestamps: ['5%'],
			});
		});

		// JPEGに変換 (Webpでもいいが、MastodonはWebpをサポートせず表示できなくなる)
		return await convertToJpeg(file, 498, 280);
	} finally {
		cleanup();
	}
}
