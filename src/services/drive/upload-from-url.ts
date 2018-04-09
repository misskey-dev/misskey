import * as URL from 'url';
import { IDriveFile, validateFileName } from '../../models/drive-file';
import create from './add-file';
import * as debug from 'debug';
import * as tmp from 'tmp';
import * as fs from 'fs';
import * as request from 'request';

const log = debug('misskey:drive:upload-from-url');

export default async (url, user, folderId = null, uri = null): Promise<IDriveFile> => {
	log(`REQUESTED: ${url}`);

	let name = URL.parse(url).pathname.split('/').pop();
	if (!validateFileName(name)) {
		name = null;
	}

	log(`name: ${name}`);

	// Create temp file
	const [path, cleanup] = await new Promise<[string, any]>((res, rej) => {
		tmp.file((e, path, fd, cleanup) => {
			if (e) return rej(e);
			res([path, cleanup]);
		});
	});

	// write content at URL to temp file
	await new Promise((res, rej) => {
		const writable = fs.createWriteStream(path);
		request(url)
			.on('error', rej)
			.on('end', () => {
				writable.close();
				res(path);
			})
			.pipe(writable)
			.on('error', rej);
	});

	const driveFile = await create(user, path, name, null, folderId, false, uri);

	log(`created: ${driveFile._id}`);

	// clean-up
	cleanup();

	return driveFile;
};
