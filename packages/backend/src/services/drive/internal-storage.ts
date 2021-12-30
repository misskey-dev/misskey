import * as fs from 'fs';
import * as Path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import config from '@/config/index';

//const _filename = fileURLToPath(import.meta.url);
const _filename = __filename;
const _dirname = dirname(_filename);

export class InternalStorage {
	private static readonly path = Path.resolve(_dirname, '../../../../../files');

	public static resolvePath = (key: string) => Path.resolve(InternalStorage.path, key);

	public static read(key: string) {
		return fs.createReadStream(InternalStorage.resolvePath(key));
	}

	public static saveFromPath(key: string, srcPath: string) {
		fs.mkdirSync(InternalStorage.path, { recursive: true });
		fs.copyFileSync(srcPath, InternalStorage.resolvePath(key));
		return `${config.url}/files/${key}`;
	}

	public static saveFromBuffer(key: string, data: Buffer) {
		fs.mkdirSync(InternalStorage.path, { recursive: true });
		fs.writeFileSync(InternalStorage.resolvePath(key), data);
		return `${config.url}/files/${key}`;
	}

	public static del(key: string) {
		fs.unlink(InternalStorage.resolvePath(key), () => {});
	}
}
