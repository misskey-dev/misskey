/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { LoggerService } from '@nestjs/common';
import Logger from '@/logger.js';

const logger = new Logger('core', 'cyan');
const nestLogger = logger.createSubLogger('nest', 'green');

// NestJSはcontextを可変長引数の末尾へ渡す。errorだけは (message, stack, context) の形も取り、
// Nest 12のlifecycle hookのように Logger.error(reason, reason.stack) とcontext無しで呼ぶ経路もある。
// stackもcontextもstringなので、ConsoleLoggerと同じ判定でstackを先に切り離してからcontextを取り出す。
const stackFormat = /^(.)+\n\s+at .+:\d+:\d+/;

function isStack(value: unknown): value is string {
	return typeof value === 'string' && stackFormat.test(value);
}

/** 可変長引数の末尾がstringならcontextとして扱う。無指定の呼び出しではundefinedを返す。 */
function takeContext(optionalParams: unknown[]): string | undefined {
	const last = optionalParams.at(-1);
	return typeof last === 'string' ? last : undefined;
}

function withContext(message: unknown, context: string | undefined): string {
	return context == null ? String(message) : `${context}: ${message}`;
}

export class NestLogger implements LoggerService {
	/**
   * Write a 'log' level log.
   */
	log(message: any, ...optionalParams: any[]) {
		nestLogger.info(withContext(message, takeContext(optionalParams)));
	}

	/**
   * Write an 'error' level log.
   */
	error(message: any, ...optionalParams: any[]) {
		const stack = optionalParams.find(isStack);
		const context = takeContext(optionalParams.filter(param => !isStack(param)));
		nestLogger.error(withContext(message, context), stack != null ? { stack } : null);
	}

	/**
   * Write a 'warn' level log.
   */
	warn(message: any, ...optionalParams: any[]) {
		nestLogger.warn(withContext(message, takeContext(optionalParams)));
	}

	/**
   * Write a 'debug' level log.
   */
	debug?(message: any, ...optionalParams: any[]) {
		if (process.env.NODE_ENV === 'production') return;
		nestLogger.debug(withContext(message, takeContext(optionalParams)));
	}

	/**
   * Write a 'verbose' level log.
   */
	verbose?(message: any, ...optionalParams: any[]) {
		if (process.env.NODE_ENV === 'production') return;
		nestLogger.debug(withContext(message, takeContext(optionalParams)));
	}
}
