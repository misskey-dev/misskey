/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as fs from 'node:fs';
import * as Path from 'node:path';
import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type { Config } from '@/config.js';
import { bindThis } from '@/decorators.js';

@Injectable()
export class InternalStorageService {
	private readonly path: string;

	constructor(
		@Inject(DI.config)
		private config: Config,
	) {
		this.path = Path.resolve(this.config.rootDir, 'files');
	}

	@bindThis
	public resolvePath(key: string) {
		return Path.resolve(this.path, key);
	}

	@bindThis
	public read(key: string) {
		return fs.createReadStream(this.resolvePath(key));
	}

	@bindThis
	public saveFromPath(key: string, srcPath: string) {
		fs.mkdirSync(this.path, { recursive: true });
		fs.copyFileSync(srcPath, this.resolvePath(key));
		return `${this.config.url}/files/${key}`;
	}

	@bindThis
	public saveFromBuffer(key: string, data: Buffer) {
		fs.mkdirSync(this.path, { recursive: true });
		fs.writeFileSync(this.resolvePath(key), data);
		return `${this.config.url}/files/${key}`;
	}

	@bindThis
	public del(key: string) {
		fs.unlink(this.resolvePath(key), () => {});
	}
}
