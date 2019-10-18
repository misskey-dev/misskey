import * as fs from 'fs';
import * as request from 'request';
import config from '../config';
import chalk from 'chalk';
import Logger from '../services/logger';

export async function downloadUrl(url: string, path: string) {
	const logger = new Logger('download');

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

		const req = request({
			url: new URL(url).href, // https://github.com/syuilo/misskey/issues/2637
			proxy: config.proxy,
			timeout: 10 * 1000,
			forever: true,
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

		logger.succ(`Downloaded to: ${path}`);
	});
}
