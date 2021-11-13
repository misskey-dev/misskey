import * as tmp from 'tmp';

export function createTemp(): Promise<[string, any]> {
	return new Promise<[string, any]>((res, rej) => {
		tmp.file((e, path, fd, cleanup) => {
			if (e) return rej(e);
			res([path, cleanup]);
		});
	});
}
