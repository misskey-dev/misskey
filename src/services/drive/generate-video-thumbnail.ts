import * as fs from 'fs';
import * as tmp from 'tmp';
import { IReadableImage, convertToJpeg } from './image-stream-processor';
import * as FFmpeg from 'fluent-ffmpeg';
import { readableRead } from '@/misc/stream/read';
import { Readable } from 'stream';

export async function GenerateVideoThumbnail(readable: Readable): Promise<IReadableImage> {
	const [outDir, cleanup] = await new Promise<[string, any]>((res, rej) => {
		tmp.dir((e, path, cleanup) => {
			if (e) return rej(e);
			res([path, cleanup]);
		});
	});

	await new Promise((res, rej) => {
		FFmpeg(readable)
			.on('end', res)
			.on('error', rej)
			.screenshot({
				folder: outDir,
				filename: 'output.png',
				count: 1,
				timestamps: ['5%']
			});
	});

	const outPath = `${outDir}/output.png`;
	const outRead = readableRead(fs.createReadStream(outPath));

	const thumbnail = convertToJpeg(outRead, 498, 280);

	// cleanup
	outRead.on('end', async () => {
		await fs.promises.unlink(outPath);
		cleanup();
	});

	return thumbnail;
}
