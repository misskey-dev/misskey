import * as fs from 'node:fs';
import * as stream from 'node:stream';
import * as util from 'node:util';
import { Inject, Injectable } from '@nestjs/common';
import IPCIDR from 'ip-cidr';
import PrivateIp from 'private-ip';
import chalk from 'chalk';
import got, * as Got from 'got';
import { parse } from 'content-disposition';
import { DI } from '@/di-symbols.js';
import type { Config } from '@/config.js';
import { HttpRequestService } from '@/core/HttpRequestService.js';
import { createTemp } from '@/misc/create-temp.js';
import { StatusError } from '@/misc/status-error.js';
import { LoggerService } from '@/core/LoggerService.js';
import type Logger from '@/logger.js';

const pipeline = util.promisify(stream.pipeline);
import { bindThis } from '@/decorators.js';

@Injectable()
export class DownloadService {
	private logger: Logger;

	constructor(
		@Inject(DI.config)
		private config: Config,

		private httpRequestService: HttpRequestService,
		private loggerService: LoggerService,
	) {
		this.logger = this.loggerService.getLogger('download');
	}

	@bindThis
	public async downloadUrl(url: string, path: string): Promise<{
		filename: string;
	}> {
		this.logger.info(`Downloading ${chalk.cyan(url)} to ${chalk.cyanBright(path)} ...`);

		const timeout = 30 * 1000;
		const operationTimeout = 60 * 1000;
		const maxSize = this.config.maxFileSize ?? 262144000;

		const urlObj = new URL(url);
		let filename = urlObj.pathname.split('/').pop() ?? 'untitled';

		const req = got.stream(url, {
			headers: {
				'User-Agent': this.config.userAgent,
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
				http: this.httpRequestService.httpAgent,
				https: this.httpRequestService.httpsAgent,
			},
			http2: false,	// default
			retry: {
				limit: 0,
			},
			enableUnixSockets: false,
		}).on('response', (res: Got.Response) => {
			if ((process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'test') && !this.config.proxy && res.ip) {
				if (this.isPrivateIp(res.ip)) {
					this.logger.warn(`Blocked address: ${res.ip}`);
					req.destroy();
				}
			}

			const contentLength = res.headers['content-length'];
			if (contentLength != null) {
				const size = Number(contentLength);
				if (size > maxSize) {
					this.logger.warn(`maxSize exceeded (${size} > ${maxSize}) on response`);
					req.destroy();
				}
			}

			const contentDisposition = res.headers['content-disposition'];
			if (contentDisposition != null) {
				const parsed = parse(contentDisposition);
				if (parsed.parameters.filename) {
					filename = parsed.parameters.filename;
				}
			}
		}).on('downloadProgress', (progress: Got.Progress) => {
			if (progress.transferred > maxSize) {
				this.logger.warn(`maxSize exceeded (${progress.transferred} > ${maxSize}) on downloadProgress`);
				req.destroy();
			}
		});

		try {
			await pipeline(req, fs.createWriteStream(path));
		} catch (e) {
			if (e instanceof Got.HTTPError) {
				throw new StatusError(`${e.response.statusCode} ${e.response.statusMessage}`, e.response.statusCode, e.response.statusMessage);
			} else {
				throw e;
			}
		}

		this.logger.succ(`Download finished: ${chalk.cyan(url)}`);

		return {
			filename,
		};
	}

	@bindThis
	public async downloadTextFile(url: string): Promise<string> {
		// Create temp file
		const [path, cleanup] = await createTemp();
	
		this.logger.info(`text file: Temp file is ${path}`);
	
		try {
			// write content at URL to temp file
			await this.downloadUrl(url, path);
	
			const text = await util.promisify(fs.readFile)(path, 'utf8');
	
			return text;
		} finally {
			cleanup();
		}
	}

	@bindThis
	private isPrivateIp(ip: string): boolean {
		for (const net of this.config.allowedPrivateNetworks ?? []) {
			const cidr = new IPCIDR(net);
			if (cidr.contains(ip)) {
				return false;
			}
		}

		return PrivateIp(ip) ?? false;
	}
}
