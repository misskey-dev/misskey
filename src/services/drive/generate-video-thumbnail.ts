import * as fs from 'fs';
import * as tmp from 'tmp';
const ThumbnailGenerator = require('video-thumbnail-generator').default;

export async function GenerateVideoThumbnail(path: string): Promise<Buffer> {
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

	await tg.generateOneByPercent(10, {
		size: '498x280',
		filename: 'output.png',
	});

	const outPath = `${outDir}/output.png`;

	const buffer = fs.readFileSync(outPath);

	// cleanup
	fs.unlinkSync(outPath);
	cleanup();

	return buffer;
}
