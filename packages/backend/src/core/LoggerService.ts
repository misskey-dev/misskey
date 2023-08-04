/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import Logger from '@/logger.js';
import { bindThis } from '@/decorators.js';
import type { KEYWORD } from 'color-convert/conversions.js';

@Injectable()
export class LoggerService {
	constructor(
	) {
	}

	@bindThis
	public getLogger(domain: string, color?: KEYWORD | undefined, store?: boolean) {
		return new Logger(domain, color, store);
	}
}
