import * as fs from 'fs';
import * as URL from 'url';
import * as tmp from 'tmp';
import * as request from 'request';

import { IDriveFile, validateFileName } from '../../models/drive-file';
import create from './add-file';
import config from '../../config';
import { IUser } from '../../models/user';
import * as mongodb from 'mongodb';
import { driveLogger } from './logger';
import chalk from 'chalk';

const logger = driveLogger.createSubLogger('downloader');

export default async (
	url: string,
	user: IUser,
	folderId: mongodb.ObjectID = null,
	uri: string = null,
	sensitive = false,
	force = false,
	link = false
): Promise<IDriveFile> => {
	let name = URL.parse(url).pathname.split('/').pop();
	if (!validateFileName(name)) {
		name = null;
	}

	// Create temp file
	const [path, cleanup] = await new Promise<[string, any]>((res, rej) => {
		tmp.file((e, path, fd, cleanup) => {
			if (e) return rej(e);
			res([path, cleanup]);
		});
	});

	// write content at URL to temp file
	await new Promise((res, rej) => {
		logger.info(`Downloading ${chalk.cyan(url)} ...`);

		const writable = fs.createWriteStream(path);

		writable.on('finish', () => {
			logger.succ(`Download succeeded: ${chalk.cyan(url)}`);
			res();
		});

		writable.on('error', error => {
			logger.error(`Download failed: ${chalk.cyan(url)}: ${error}`, {
				url: url,
				e: error
			});
			rej(error);
		});

		const requestUrl = URL.parse(url).pathname.match(/[^\u0021-\u00ff]/) ? encodeURI(url) : url;

		const req = request({
			url: requestUrl,
			proxy: config.proxy,
			timeout: 10 * 1000,
			headers: {
				'User-Agent': config.userAgent
			}
		});

		req.pipe(writable);

		req.on('response', response => {
			if (response.statusCode !== 200) {
				logger.error(`Got ${response.statusCode} (${url})`);
				writable.close();
				rej(response.statusCode);
			}
		});

		req.on('error', error => {
			logger.error(`Failed to start download: ${chalk.cyan(url)}: ${error}`, {
				url: url,
				e: error
			});
			writable.close();
			rej(error);
		});
	});

	let driveFile: IDriveFile;
	let error;

	try {
		driveFile = await create(user, path, name, null, folderId, force, link, url, uri, sensitive);
		logger.succ(`Got: ${driveFile._id}`);
	} catch (e) {
		error = e;
		logger.error(`Failed to create drive file: ${e}`, {
			url: url,
			e: e
		});
	}

	// clean-up
	cleanup();

	if (error) {
		throw error;
	} else {
		return driveFile;
	}
};
