import * as fs from 'fs';
import * as URL from 'url';

import * as debug from 'debug';
import * as tmp from 'tmp';
import * as request from 'request';

import { IDriveFile, validateFileName } from '../../models/drive-file';
import create from './add-file';
import config from '../../config';
import { IUser } from '../../models/user';
import * as mongodb from 'mongodb';

const log = debug('misskey:drive:upload-from-url');

export default async (
	url: string,
	user: IUser,
	folderId: mongodb.ObjectID = null,
	uri: string = null,
	sensitive = false,
	force = false,
	link = false
): Promise<IDriveFile> => {
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

		writable.on('finish', () => {
			res();
		});

		writable.on('error', error => {
			rej(error);
		});

		const requestUrl = URL.parse(url).pathname.match(/[^\u0021-\u00ff]/) ? encodeURI(url) : url;

		const req = request({
			url: requestUrl,
			proxy: config.proxy,
			timeout: 10 * 1000,
			headers: {
				'User-Agent': config.user_agent
			}
		});

		req.pipe(writable);

		req.on('response', response => {
			if (response.statusCode !== 200) {
				writable.close();
				rej(response.statusCode);
			}
		});

		req.on('error', error => {
			writable.close();
			rej(error);
		});
	});

	let driveFile: IDriveFile;
	let error;

	try {
		driveFile = await create(user, path, name, null, folderId, force, link, url, uri, sensitive);
		log(`got: ${driveFile._id}`);
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
