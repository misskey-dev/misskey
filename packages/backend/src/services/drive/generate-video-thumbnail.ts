import * as fs from 'node:fs';
import { createTempDir } from '@/misc/create-temp.js';
import { IImage, convertToJpeg } from './image-processor.js';
import FFmpeg from 'fluent-ffmpeg';

export async function GenerateVideoThumbnail(source: string): Promise<IImage> {
	const [dir, cleanup] = await createTempDir();

	const outFile = `${dir}/out.png`;

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

		// JPEGに変換 (Webpでもいいが、MastodonはWebpをサポートせず表示できなくなる)
		return await convertToJpeg(outFile, 498, 280);
	} finally {
		await fs.promises.unlink(outFile);
		cleanup();
	}
}
