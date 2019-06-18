import * as fs from 'fs';
import * as request from 'request';
import config from '../config';
import chalk from 'chalk';
import Logger from '../services/logger';

export async function downloadUrl(url: string, path: string) {
	const logger = new Logger('download-url');

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

		// 多バイト文字が含まれてそうだったらリクエスト前にURIエンコードする
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

		logger.succ(`Downloaded to: ${path}`);
	});
}
