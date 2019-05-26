import * as fs from 'fs';
import * as tmp from 'tmp';
import { IImage, convertToJpeg } from './image-processor';
const ThumbnailGenerator = require('video-thumbnail-generator').default;

export async function GenerateVideoThumbnail(path: string): Promise<IImage> {
	const [outDir, cleanup] = await new Promise<[string, any]>((res, rej) => {
		tmp.dir((e, path, cleanup) => {
			if (e) return rej(e);
			res([path, cleanup]);
		});
	});

	const tg = new ThumbnailGenerator({
		sourcePath: path,
		thumbnailPath: outDir,
	});

	await tg.generateOneByPercent(5, {
		size: '100%',
		filename: 'output.png',
	});

	const outPath = `${outDir}/output.png`;

	const thumbnail = await convertToJpeg(outPath, 498, 280);

	// cleanup
	fs.unlinkSync(outPath);
	cleanup();

	return thumbnail;
}
