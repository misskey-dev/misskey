import * as stream from 'stream';

export const preventEmptyStream = () => {
	let length = 0;

	return new stream.Transform({
		transform(chunk, encoding, cb) {
			length += chunk.length;
			this.push(chunk);
			cb();
		},
		final(cb) {
			if (length === 0) cb(new Error('EMPTY STREAM!'));
		},
	});
};
