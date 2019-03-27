import * as fs from 'fs';
import config from '../../config';

export class InternalStorage {
	private static readonly path = `${__dirname}/../../../../files`;

	public static read(key: string) {
		return fs.createReadStream(`${InternalStorage.path}/${key}`);
	}

	public static saveFromPath(key: string, srcPath: string) {
		fs.copyFile(srcPath, `${InternalStorage.path}/${key}`, () => {});
		return `${config.url}/files/${key}`;
	}

	public static saveFromBuffer(key: string, data: Buffer) {
		fs.writeFile(`${InternalStorage.path}/${key}`, data, () => {});
		return `${config.url}/files/${key}`;
	}

	public static del(key: string) {
		fs.unlink(`${InternalStorage.path}/${key}`, () => {});
	}
}
