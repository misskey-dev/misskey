import * as fs from 'fs';
import * as stream from 'stream';
import * as util from 'util';
import fetch from 'node-fetch';
import { httpAgent, httpsAgent } from './fetch';
import config from '../config';
import * as chalk from 'chalk';
import Logger from '../services/logger';

const pipeline = util.promisify(stream.pipeline);

export async function downloadUrl(url: string, path: string) {
	const logger = new Logger('download');

	logger.info(`Downloading ${chalk.cyan(url)} ...`);

	const response = await fetch(new URL(url).href, {
		headers: {
			'User-Agent': config.userAgent
		},
		timeout: 10 * 1000,
		agent: u => u.protocol == 'http:' ? httpAgent : httpsAgent,
	});

	if (!response.ok) {
		logger.error(`Got ${response.status} (${url})`);
		throw response.status;
	}

	await pipeline(response.body, fs.createWriteStream(path));

	logger.succ(`Download finished: ${chalk.cyan(url)}`);
}
