import { PassThrough, Readable } from 'stream';

export function cloneStream(readable: Readable) {
	return readable.pipe(new PassThrough());
}
