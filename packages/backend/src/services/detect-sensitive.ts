import * as fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import * as nsfw from 'nsfwjs';

const _filename = fileURLToPath(import.meta.url);
const _dirname = dirname(_filename);

let model: nsfw.NSFWJS;

export async function detectSensitive(path: string): Promise<nsfw.predictionType[] | null> {
	try {
		const tf = await import('@tensorflow/tfjs-node');

		if (model == null) model = await nsfw.load(`file://${_dirname}/../../nsfw-model/`, { size: 299 });

		const buffer = await fs.promises.readFile(path);
		const image = await tf.node.decodeImage(buffer, 3) as any;
		try {
			const predictions = await model.classify(image);
			return predictions;
		} finally {
			image.dispose();
		}
	} catch (err) {
		console.error(err);
		return null;
	}
}
