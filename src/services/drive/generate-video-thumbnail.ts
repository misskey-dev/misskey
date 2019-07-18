import * as fs from 'fs';
import * as tmp from 'tmp';
import { IImage, convertToJpeg } from './image-processor';
import * as child_process from 'child_process';

export async function GenerateVideoThumbnail(path: string): Promise<IImage> {
	const [outDir, cleanup] = await new Promise<[string, any]>((res, rej) => {
		tmp.dir((e, path, cleanup) => {
			if (e) return rej(e);
			res([path, cleanup]);
		});
	});

	const outPath = `${outDir}/output.png`;

	await new Promise((res, rej) => {
		const process = child_process.spawn('ffmpeg', ['-i', path, '-vframes', '1', '-f', 'image2', outPath], {});
		process.addListener('exit', code => {
			if (code === 0) res(); else rej(`Exit code is not 0 (${code})`);
		});
		process.addListener('error', rej);
	});

	const thumbnail = await convertToJpeg(outPath, 498, 280);

	// cleanup
	await fs.promises.unlink(outPath);
	cleanup();

	return thumbnail;
}
