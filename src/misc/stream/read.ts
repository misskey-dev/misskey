import { Readable } from 'stream';

// See https://www.geeksforgeeks.org/node-js-readable-stream-end-event/
export function readableRead(readable: Readable) {
	readable.on('readable', () => {
		while (readable.read() !== null) {
			// nothing to do
		}
	});
	return readable;
}
