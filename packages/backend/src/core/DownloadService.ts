/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as fs from 'node:fs';
import { Inject, Injectable } from '@nestjs/common';
import chalk from 'chalk';
import { downloadUrl, StatusError as MediaCoreStatusError } from '@misskey-dev/media-core';
import { DI } from '@/di-symbols.js';
import type { Config } from '@/config.js';
import { HttpRequestService } from '@/core/HttpRequestService.js';
import { createTemp } from '@/misc/create-temp.js';
import { StatusError } from '@/misc/status-error.js';
import { LoggerService } from '@/core/LoggerService.js';
import type Logger from '@/logger.js';

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

		const { filename } = await downloadUrl(url, path, {
			userAgent: this.config.userAgent,
			maxSize: this.config.maxFileSize,
			// リダイレクト先を含め、proxyBypassHosts を考慮したエージェントを URL ごとに選択する
			// (ローカルアドレスへの接続はエージェント側で遮断される)
			getAgents: (target) => ({
				http: this.httpRequestService.getAgentForHttp(target),
				https: this.httpRequestService.getAgentForHttps(target),
			}),
			logger: {
				warn: (message, error) => this.logger.warn(message, error != null ? { stack: error } : null),
			},
		}).catch(err => {
			// media-core の StatusError は backend の StatusError とは別クラスなので、
			// 呼び出し側の instanceof StatusError による判定 (リトライ可否など) が効くように詰め替える
			if (err instanceof MediaCoreStatusError) {
				throw new StatusError(err.message, err.statusCode, err.statusMessage);
			}
			throw err;
		});

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

			const text = await fs.promises.readFile(path, 'utf8');

			return text;
		} finally {
			cleanup();
		}
	}
}
