import { PassThrough, Readable } from 'stream';

export function toBuffer(readable: Readable) {
	return new Promise<Buffer>((resolve, reject) => {
		const timeout = setTimeout(() => {
			reject('STREAM TIMEOUT');
		}, 5000);

		const chunks: Uint8Array[] = [];
		readable
			.on('data', chunk => chunks.push(chunk))
			.on('end', () => {
				clearTimeout(timeout);
				resolve(Buffer.concat(chunks));	
			})
			.on('error', reject);
	});
}
