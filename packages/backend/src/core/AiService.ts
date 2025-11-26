/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { Inject, Injectable } from '@nestjs/common';
import * as nsfw from 'nsfwjs';
import si from 'systeminformation';
import { Mutex } from 'async-mutex';
import fetch from 'node-fetch';
import { bindThis } from '@/decorators.js';
import { DI } from '@/di-symbols.js';
import type { MiMeta } from '@/models/Meta.js';
import { HttpRequestService } from '@/core/HttpRequestService.js';

const _filename = fileURLToPath(import.meta.url);
const _dirname = dirname(_filename);

const REQUIRED_CPU_FLAGS_X64 = ['avx2', 'fma'];
let isSupportedCpu: undefined | boolean = undefined;

@Injectable()
export class AiService {
	private model: nsfw.NSFWJS;
	private modelLoadMutex: Mutex = new Mutex();

	constructor(
		@Inject(DI.meta)
		private meta: MiMeta,

		private httpRequestService: HttpRequestService,
	) {
	}

	/**
	 * Detect sensitive content in an image.
	 * 
	 * If an external proxy URL is configured (sensitiveMediaDetectionProxyUrl),
	 * this method will use the external service. Otherwise, it will use the
	 * built-in nsfwjs model.
	 * 
	 * @param source - Path to the image file or a Buffer containing the image data
	 * @returns Array of predictions or null if detection fails
	 */
	@bindThis
	public async detectSensitive(source: string | Buffer): Promise<nsfw.PredictionType[] | null> {
		// If external service is configured, use it
		if (this.meta.sensitiveMediaDetectionProxyUrl) {
			return await this.detectSensitiveWithProxy(source);
		}

		// Otherwise, use the local nsfwjs model
		try {
			if (isSupportedCpu === undefined) {
				isSupportedCpu = await this.computeIsSupportedCpu();
			}

			if (!isSupportedCpu) {
				console.error('This CPU cannot use TensorFlow.');
				return null;
			}

			const tf = await import('@tensorflow/tfjs-node');
			tf.env().global.fetch = fetch;

			if (this.model == null) {
				await this.modelLoadMutex.runExclusive(async () => {
					if (this.model == null) {
						this.model = await nsfw.load(`file://${_dirname}/../../nsfw-model/`, { size: 299 });
					}
				});
			}

			const buffer = source instanceof Buffer ? source : await fs.promises.readFile(source);
			const image = await tf.node.decodeImage(buffer, 3) as any;
			try {
				const predictions = await this.model.classify(image);
				return predictions;
			} finally {
				image.dispose();
			}
		} catch (err) {
			console.error(err);
			return null;
		}
	}

	/**
	 * Detect sensitive content using an external proxy service.
	 * 
	 * Sends the image as base64-encoded data to the external service
	 * and expects a response in the same format as nsfwjs.
	 * 
	 * @param source - Path to the image file or a Buffer containing the image data
	 * @returns Array of predictions or null if the request fails
	 * @see docs/sensitive-media-detection-api.md for API contract details
	 */
	@bindThis
	private async detectSensitiveWithProxy(source: string | Buffer): Promise<nsfw.PredictionType[] | null> {
		try {
			const buffer = source instanceof Buffer ? source : await fs.promises.readFile(source);
			const base64 = buffer.toString('base64');
			
			const response = await this.httpRequestService.send(this.meta.sensitiveMediaDetectionProxyUrl!, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ image: base64 }),
				timeout: 10000,
			});

			const json = await response.json() as { predictions: nsfw.PredictionType[] };
			return json.predictions;
		} catch (err) {
			console.error('Failed to detect sensitive media with proxy:', err);
			return null;
		}
	}

	private async computeIsSupportedCpu(): Promise<boolean> {
		switch (process.arch) {
			case 'x64': {
				const cpuFlags = await this.getCpuFlags();
				return REQUIRED_CPU_FLAGS_X64.every(required => cpuFlags.includes(required));
			}
			case 'arm64': {
				// As far as I know, no required CPU flags for ARM64.
				return true;
			}
			default: {
				return false;
			}
		}
	}

	@bindThis
	private async getCpuFlags(): Promise<string[]> {
		const str = await si.cpuFlags();
		return str.split(/\s+/);
	}
}
