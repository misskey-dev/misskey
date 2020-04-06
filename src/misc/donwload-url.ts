import * as fs from 'fs';
import fetch from 'node-fetch';
import { httpAgent, httpsAgent } from './fetch';
import config from '../config';
import * as chalk from 'chalk';
import Logger from '../services/logger';

export async function downloadUrl(url: string, path: string) {
	const logger = new Logger('download');

	logger.info(`Downloading ${chalk.cyan(url)} ...`);

	const response = await fetch(new URL(url).href, {
		headers: {
			'User-Agent': config.userAgent
		},
		timeout: 10 * 1000,
		agent: u => u.protocol == 'http:' ? httpAgent : httpsAgent,
	}).then(response => {
		if (!response.ok) {
			logger.error(`Got ${response.status} (${url})`);
			throw response.status;
		} else {
			return response;
		}
	});

	await new Promise((res, rej) => {
		const writable = fs.createWriteStream(path);

		response.body.on('error', (error: any) => {
			logger.error(`Failed to start download: ${chalk.cyan(url)}: ${error}`, {
				url: url,
				e: error
			});
			writable.close();
			rej(error);
		});

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

		response.body.pipe(writable);
	});
}
