/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { Injectable, Inject } from '@nestjs/common';
import { Mutex } from 'async-mutex';
import fetch from 'node-fetch';
import { DI } from '@/di-symbols.js';
import { bindThis } from '@/decorators.js';
import type { Config } from '@/config.js';
import type { NSFWJS, PredictionType } from 'nsfwjs/core';

const REQUIRED_CPU_FLAGS_X64 = ['avx2', 'fma'];
let isSupportedCpu: undefined | boolean = undefined;

@Injectable()
export class AiService {
	private readonly modelDir: string;
	private model: NSFWJS;
	private modelLoadMutex: Mutex = new Mutex();

	constructor(
		@Inject(DI.config)
		private config: Config,
	) {
		const md = resolve(this.config.rootDir, 'packages/backend/nsfw-model');
		this.modelDir = md.endsWith('/') ? md : md + '/';
	}

	@bindThis
	public async detectSensitive(source: string | Buffer): Promise<PredictionType[] | null> {
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
				const nsfw = await import('nsfwjs/core');
				await this.modelLoadMutex.runExclusive(async () => {
					if (this.model == null) {
						this.model = await nsfw.load(pathToFileURL(this.modelDir).toString(), { size: 299 });
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
		const si = await import('systeminformation');
		const str = await si.cpuFlags();
		return str.split(/\s+/);
	}
}
