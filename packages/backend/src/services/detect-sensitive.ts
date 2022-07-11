import * as fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import * as nsfw from 'nsfwjs';
import si from 'systeminformation';

const _filename = fileURLToPath(import.meta.url);
const _dirname = dirname(_filename);

const REQUIRED_CPU_FLAGS = ['avx2', 'fma'];
let isSupportedCpu: undefined | boolean = undefined;

let model: nsfw.NSFWJS;

export async function detectSensitive(path: string): Promise<nsfw.predictionType[] | null> {
	try {
		if (isSupportedCpu === undefined) {
			const cpuFlags = await getCpuFlags();
			isSupportedCpu = REQUIRED_CPU_FLAGS.every(required => cpuFlags.includes(required));
		}

		if (!isSupportedCpu) {
			console.error('This CPU cannot use TensorFlow.');
			return null;
		}

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

async function getCpuFlags(): Promise<string[]> {
	const str = await si.cpuFlags();
	return str.split(/\s+/);
}
