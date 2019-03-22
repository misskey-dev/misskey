import * as fs from 'fs';

export class InternalStorage {
	private static readonly path = `${__dirname}/../../../../files`;

	public static saveFromPath(key: string, srcPath: string) {
		fs.copyFile(srcPath, `${InternalStorage.path}/${key}`, () => {});
	}

	public static saveFromBuffer(key: string, data: Buffer) {
		fs.writeFile(`${InternalStorage.path}/${key}`, data, () => {});
	}

	public static del(key: string) {
		fs.unlink(`${InternalStorage.path}/${key}`, () => {});
	}
}
