import * as tmp from 'tmp';

export function createTemp(): Promise<[string, unknown]> {
	return new Promise<[string, unknown]>((res, rej) => {
		tmp.file((e, path, fd, cleanup) => {
			if (e) return rej(e);
			res([path, cleanup]);
		});
	});
}
