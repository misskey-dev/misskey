import * as fs from 'fs';
import * as stream from 'stream';
import * as util from 'util';
import got, * as Got from 'got';
import { httpAgent, httpsAgent } from './fetch';
import config from '@/config/index';
import * as chalk from 'chalk';
import Logger from '@/services/logger';
import * as IPCIDR from 'ip-cidr';
const PrivateIp = require('private-ip');

const pipeline = util.promisify(stream.pipeline);

export async function downloadUrl(url: string, path: string) {
	const logger = new Logger('download');

	logger.info(`Downloading ${chalk.cyan(url)} ...`);

	const timeout = 30 * 1000;
	const operationTimeout = 60 * 1000;

	const req = got.stream(url, {
		headers: {
			'User-Agent': config.userAgent
		},
		timeout: {
			lookup: timeout,
			connect: timeout,
			secureConnect: timeout,
			socket: timeout,	// read timeout
			response: timeout,
			send: timeout,
			request: operationTimeout,	// whole operation timeout
		},
		agent: {
			http: httpAgent,
			https: httpsAgent,
		},
		retry: 0,
	}).on('response', (res: Got.Response) => {
		if ((process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'test') && !config.proxy && res.ip) {
			if (isPrivateIp(res.ip)) {
				logger.warn(`Blocked address: ${res.ip}`);
				req.destroy();
			}
		}
	}).on('error', (e: any) => {
		if (e.name === 'HTTPError') {
			const statusCode = e.response?.statusCode;
			const statusMessage = e.response?.statusMessage;
			e.name = `StatusError`;
			e.statusCode = statusCode;
			e.message = `${statusCode} ${statusMessage}`;
		}
	});

	await pipeline(req, fs.createWriteStream(path));

	logger.succ(`Download finished: ${chalk.cyan(url)}`);
}

function isPrivateIp(ip: string) {
	for (const net of config.allowedPrivateNetworks || []) {
		const cidr = new IPCIDR(net);
		if (cidr.contains(ip)) {
			return false;
		}
	}

	return PrivateIp(ip);
}
