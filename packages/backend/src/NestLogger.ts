/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { LoggerService } from '@nestjs/common';
import Logger from '@/logger.js';

const logger = new Logger('core', 'cyan');
const nestLogger = logger.createSubLogger('nest', 'green', false);

export class NestLogger implements LoggerService {
	/**
   * Write a 'log' level log.
   */
	log(message: any, ...optionalParams: any[]) {
		const ctx = optionalParams[0];
		nestLogger.info(ctx + ': ' + message);
	}

	/**
   * Write an 'error' level log.
   */
	error(message: any, ...optionalParams: any[]) {
		const ctx = optionalParams[0];
		nestLogger.error(ctx + ': ' + message);
	}

	/**
   * Write a 'warn' level log.
   */
	warn(message: any, ...optionalParams: any[]) {
		const ctx = optionalParams[0];
		nestLogger.warn(ctx + ': ' + message);
	}

	/**
   * Write a 'debug' level log.
   */
	debug?(message: any, ...optionalParams: any[]) {
		if (process.env.NODE_ENV === 'production') return;
		const ctx = optionalParams[0];
		nestLogger.debug(ctx + ': ' + message);
	}

	/**
   * Write a 'verbose' level log.
   */
	verbose?(message: any, ...optionalParams: any[]) {
		if (process.env.NODE_ENV === 'production') return;
		const ctx = optionalParams[0];
		nestLogger.debug(ctx + ': ' + message);
	}
}
