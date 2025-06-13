/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import type { Config } from '@/config.js';
import { DI } from '@/di-symbols.js';
import type Logger from '@/logger.js';
import { bindThis } from '@/decorators.js';

@Injectable()
export class CommandService {
	private logger: Logger;

	constructor(
		@Inject(DI.config)
		private config: Config,
	) {
	}

	@bindThis
	public async ping() {
		console.log('pong');
	}
}
