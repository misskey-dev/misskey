import * as tmp from 'tmp';
import * as fs from 'fs';
import * as util from 'util';
import chalk from 'chalk';
import * as request from 'request';
import Logger from '../services/logger';
import config from '../config';

const logger = new Logger('download-text-file');

export async function downloadTextFile(url: string): Promise<string> {
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

	const text = await util.promisify(fs.readFile)(path, 'utf8');

	cleanup();

	return text;
}
