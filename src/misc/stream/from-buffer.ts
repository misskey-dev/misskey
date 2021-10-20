import { Readable } from 'stream';
import { BufferArray } from '@/misc/stream/to-buffer-array';

export function fromBufferArray(bufferArray: BufferArray) {
	return Readable.from(bufferArray.chunks);
}

export function fromBuffer(buffer: Uint8Array[] | Buffer[] | Buffer) {
	return Readable.from(buffer);
}
