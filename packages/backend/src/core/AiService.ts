/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { Injectable } from '@nestjs/common';
import * as nsfw from 'nsfwjs';
import si from 'systeminformation';
import { Mutex } from 'async-mutex';
import { sharpBmp } from '@misskey-dev/sharp-read-bmp';
import { bindThis } from '@/decorators.js';
import type Logger from '@/logger.js';
import { LoggerService } from '@/core/LoggerService.js';

const _filename = fileURLToPath(import.meta.url);
const _dirname = dirname(_filename);

const REQUIRED_CPU_FLAGS = ['avx2', 'fma'];
let isSupportedCpu: undefined | boolean = undefined;

@Injectable()
export class AiService {
	private logger: Logger;
	private model: nsfw.NSFWJS;
	private modelLoadMutex: Mutex = new Mutex();

	constructor(
		private loggerService: LoggerService,
	) {
		this.logger = this.loggerService.getLogger('ai');
	}

	@bindThis
	public async detectSensitive(path: string, mime: string): Promise<nsfw.PredictionType[] | null> {
		try {
			if (isSupportedCpu === undefined) {
				const cpuFlags = await this.getCpuFlags();
				isSupportedCpu = REQUIRED_CPU_FLAGS.every(required => cpuFlags.includes(required));
			}

			if (!isSupportedCpu) {
				this.logger.error('This CPU cannot use TensorFlow.');
				return null;
			}

			const tf = await import('@tensorflow/tfjs-node');

			if (this.model == null) {
				await this.modelLoadMutex.runExclusive(async () => {
					if (this.model == null) {
						this.model = await nsfw.load(`file://${_dirname}/../../nsfw-model/`, { size: 299 });
					}
				});
			}

			const sharp = await sharpBmp(path, mime);
			const { data, info } = await sharp
				.resize(299, 299, { fit: 'inside' })
				.ensureAlpha()
				.raw({ depth: 'int' })
				.toBuffer({ resolveWithObject: true });

			const image = tf.tensor3d(data, [info.height, info.width, info.channels], 'int32');
			try {
				return await this.model.classify(image);
			} finally {
				image.dispose();
			}
		} catch (err) {
			this.logger.error('Failed to detect sensitive', { error: err });
			return null;
		}
	}

	@bindThis
	private async getCpuFlags(): Promise<string[]> {
		const str = await si.cpuFlags();
		return str.split(/\s+/);
	}
}
