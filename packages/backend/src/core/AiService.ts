/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as fs from 'node:fs';
import * as http from 'node:http';
import * as https from 'node:https';
import FormData from 'form-data';
import { DI } from '@/di-symbols.js';
import type { Config } from '@/config.js';
import { Inject, Injectable } from '@nestjs/common';
import { HttpRequestService } from '@/core/HttpRequestService.js';
import { bindThis } from '@/decorators.js';

type SensitivityDetectionResult = {
	sensitive: boolean;
	porn: boolean;
};

@Injectable()
export class AiService {
	constructor(
		@Inject(DI.config)
		private config: Config,

		private httpRequestService: HttpRequestService,
	) {
	}

	@bindThis
	public async detectSensitivity(source: string | Buffer, fileType: string): Promise<null | SensitivityDetectionResult> {
		if (this.config.mediaSensitivityDetectorUrl == null) {
			return null;
		}

		const buffer = source instanceof Buffer ? source : fs.createReadStream(source);
		const formData = new FormData();
		formData.append('apiKey', this.config.mediaSensitivityDetectorApiKey ?? '');
		formData.append('file', buffer, {
			contentType: fileType,
		});

		const url = new URL('/v1/detect', this.config.mediaSensitivityDetectorUrl);
		const agent = this.httpRequestService.getAgentByUrl(url, undefined, true);
		const hModule = url.protocol === 'http:' ? http : https;

		return new Promise<null | SensitivityDetectionResult>((resolve, reject) => {
			let responseReceived = false;

			const req = hModule.request({
				method: 'POST',
				agent,
				headers: {
					'user-agent': this.config.userAgent,
					...formData.getHeaders(),
				},
				host: url.hostname,
				port: url.port,
			}, (res) => {
				responseReceived = true;
				const chunks: Buffer[] = [];

				res.on('data', (chunk) => {
					chunks.push(chunk);
				});

				res.on('end', () => {
					const body = Buffer.concat(chunks).toString('utf-8');
					if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
						try {
							const data = JSON.parse(body);
							if (typeof data.sensitive === 'boolean' && typeof data.porn === 'boolean') {
								resolve({
									sensitive: data.sensitive,
									porn: data.porn,
								});
							} else {
								resolve(null);
							}
						} catch {
							resolve(null);
						}
					}
				});
			}).on('error', (err) => {
				if (err instanceof Error) {
					// ECONNRESET and EPIPE are resulted from early return
					if ((err.message.includes('ECONNRESET') || err.message.includes('EPIPE')) && !responseReceived) {
						return;
					}

					if (!responseReceived) {
						reject(err);
					}
				}
			});

			formData.pipe(req);
		});
	}
}
