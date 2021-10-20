import { Readable } from 'stream';

export type BufferArray = { size: number; chunks: Uint8Array[] };

export function toBufferArray(readable: Readable) {
	return new Promise<BufferArray>((resolve, reject) => {
		const timeout = setTimeout(() => {
			reject('STREAM TIMEOUT');
		}, 5000);

		const result: BufferArray = { size: 0, chunks: [] };

		readable
			.on('data', chunk => {
				result.size += chunk.length;
				result.chunks.push(chunk);
			})
			.on('end', () => {
				clearTimeout(timeout);
				resolve(result);
			})
			.on('error', reject);
	});
}
