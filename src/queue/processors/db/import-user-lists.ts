import * as Bull from 'bull';
import * as tmp from 'tmp';
import * as fs from 'fs';
import * as util from 'util';
import * as mongo from 'mongodb';
import * as request from 'request';

import { queueLogger } from '../../logger';
import User from '../../../models/user';
import config from '../../../config';
import UserList from '../../../models/user-list';
import DriveFile from '../../../models/drive-file';
import chalk from 'chalk';
import { getOriginalUrl } from '../../../misc/get-drive-file-url';
import parseAcct from '../../../misc/acct/parse';
import resolveUser from '../../../remote/resolve-user';

const logger = queueLogger.createSubLogger('import-user-lists');

export async function importUserLists(job: Bull.Job, done: any): Promise<void> {
	logger.info(`Importing user lists of ${job.data.user._id} ...`);

	const user = await User.findOne({
		_id: new mongo.ObjectID(job.data.user._id.toString())
	});

	const file = await DriveFile.findOne({
		_id: new mongo.ObjectID(job.data.fileId.toString())
	});

	const url = getOriginalUrl(file);

	// Create temp file
	const [path, cleanup] = await new Promise<[string, any]>((res, rej) => {
		tmp.file((e, path, fd, cleanup) => {
			if (e) return rej(e);
			res([path, cleanup]);
		});
	});

	logger.info(`Temp file is ${path}`);

	// write content at URL to temp file
	await new Promise((res, rej) => {
		logger.info(`Downloading ${chalk.cyan(url)} ...`);

		const writable = fs.createWriteStream(path);

		writable.on('finish', () => {
			logger.succ(`Download finished: ${chalk.cyan(url)}`);
			res();
		});

		writable.on('error', error => {
			logger.error(`Download failed: ${chalk.cyan(url)}: ${error}`, {
				url: url,
				e: error
			});
			rej(error);
		});

		const requestUrl = new URL(url).pathname.match(/[^\u0021-\u00ff]/) ? encodeURI(url) : url;

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

	logger.succ(`Downloaded to: ${path}`);

	const csv = await util.promisify(fs.readFile)(path, 'utf8');

	for (const line of csv.trim().split('\n')) {
		const listName = line.split(',')[0].trim();
		const { username, host } = parseAcct(line.split(',')[1].trim());

		let list = await UserList.findOne({
			userId: user._id,
			title: listName
		});

		if (list == null) {
			list = await UserList.insert({
				createdAt: new Date(),
				userId: user._id,
				title: listName,
				userIds: []
			});
		}

		let target = host === config.host ? await User.findOne({
			host: null,
			usernameLower: username.toLowerCase()
		}) : await User.findOne({
			host: host,
			usernameLower: username.toLowerCase()
		});

		if (host == null && target == null) continue;
		if (list.userIds.some(id => id.equals(target._id))) continue;

		if (target == null) {
			target = await resolveUser(username, host);
		}

		await UserList.update({ _id: list._id }, {
			$push: {
				userIds: target._id
			}
		});
	}

	logger.succ('Imported');
	cleanup();
	done();
}
