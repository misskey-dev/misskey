import { Readable } from 'stream';

// See https://www.geeksforgeeks.org/node-js-readable-stream-end-event/
export function readableRead(readable: Readable) {
	readable.on('readable', () => readable.read());
	return readable;
}
