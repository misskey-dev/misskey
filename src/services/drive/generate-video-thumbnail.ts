import * as fs from 'fs';
import * as stream from 'stream';
import * as util from 'util';
import { IReadableImage, convertToJpeg } from './image-processor';
import * as FFmpeg from 'fluent-ffmpeg';
import { createTemp } from '@/misc/create-temp';
import { readableRead } from '@/misc/stream/read';

const pipeline = util.promisify(stream.pipeline);

export async function GenerateVideoThumbnailFromStream(readable: stream.Readable): Promise<IReadableImage> {
	const [path, cleanupVideo] = await createTemp();

	await pipeline(readable, fs.createWriteStream(path));

	const thumbnail = await GenerateVideoThumbnail(path);

	cleanupVideo();

	return thumbnail;
}

export async function GenerateVideoThumbnail(path: string): Promise<IReadableImage> {
	const [outDir, cleanupDir] = await createTemp();

	await new Promise((res, rej) => {
		FFmpeg({
			source: path
		})
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

	const thumbnail = convertToJpeg(readableRead(fs.createReadStream(outPath)), 498, 280);

	cleanupDir();

	return thumbnail;
}
