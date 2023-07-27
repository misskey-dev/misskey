/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import type Logger from '@/logger.js';
import { RemoteLoggerService } from '@/core/RemoteLoggerService.js';

@Injectable()
export class ApLoggerService {
	public logger: Logger;

	constructor(
		private remoteLoggerService: RemoteLoggerService,
	) {
		this.logger = this.remoteLoggerService.logger.createSubLogger('ap', 'magenta');
	}
}
