import * as fs from 'fs';
import * as Path from 'path';
import config from '../../config';

export class InternalStorage {
	private static readonly path = Path.resolve(`${__dirname}/../../../files`);

	public static read(key: string) {
		return fs.createReadStream(`${InternalStorage.path}/${key}`);
	}

	public static saveFromPath(key: string, srcPath: string) {
		fs.mkdirSync(InternalStorage.path, { recursive: true });
		fs.copyFileSync(srcPath, `${InternalStorage.path}/${key}`);
		return `${config.url}/files/${key}`;
	}

	public static saveFromBuffer(key: string, data: Buffer) {
		fs.mkdirSync(InternalStorage.path, { recursive: true });
		fs.writeFileSync(`${InternalStorage.path}/${key}`, data);
		return `${config.url}/files/${key}`;
	}

	public static del(key: string) {
		fs.unlink(`${InternalStorage.path}/${key}`, () => {});
	}
}
