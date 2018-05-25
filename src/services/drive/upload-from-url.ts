import * as fs from 'fs';
import * as URL from 'url';

import * as debug from 'debug';
import * as tmp from 'tmp';
import * as request from 'request';

import { IDriveFile, validateFileName } from '../../models/drive-file';
import create from './add-file';
import config from '../../config';

const log = debug('misskey:drive:upload-from-url');

export default async (url: string, user, folderId = null, uri: string = null): Promise<IDriveFile> => {
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
				res();
			})
			.pipe(writable)
			.on('error', rej);
	});

	let driveFile: IDriveFile;
	let error;

	try {
		driveFile = await create(user, path, name, null, folderId, false, config.preventCacheRemoteFiles, url, uri);
		log(`created: ${driveFile._id}`);
	} catch (e) {
		error = e;
		log(`failed: ${e}`);
	}

	// clean-up
	cleanup();

	if (error) {
		throw error;
	} else {
		return driveFile;
	}
};
