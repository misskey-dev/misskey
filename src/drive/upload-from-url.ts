import * as URL from 'url';
import { IDriveFile, validateFileName } from '../models/drive-file';
import create from './add-file';
import * as debug from 'debug';
import * as tmp from 'tmp';
import * as fs from 'fs';
import * as request from 'request';

const log = debug('misskey:common:drive:upload_from_url');

export default async (url, user, folderId = null): Promise<IDriveFile> => {
	let name = URL.parse(url).pathname.split('/').pop();
	if (!validateFileName(name)) {
		name = null;
	}

	// Create temp file
	const path = await new Promise((res: (string) => void, rej) => {
		tmp.file((e, path) => {
			if (e) return rej(e);
			res(path);
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

	const driveFile = await create(user, path, name, null, folderId);

	// clean-up
	fs.unlink(path, (e) => {
		if (e) log(e.stack);
	});

	return driveFile;
};
