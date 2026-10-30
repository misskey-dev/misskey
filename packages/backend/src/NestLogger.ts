/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ConsoleLogger, LOG_LEVELS } from '@nestjs/common';
import Logger from '@/logger.js';
import type { LogLevel as NestLogLevel } from '@nestjs/common';
import type { LogLevel as MisskeyLogLevel } from '@/logging/types.js';

const logger = new Logger('core', 'cyan');
const nestLogger = logger.createSubLogger('nest', 'green');

const levelMap: Record<NestLogLevel, MisskeyLogLevel> = {
	verbose: 'debug',
	debug: 'debug',
	log: 'info',
	warn: 'warn',
	error: 'error',
	fatal: 'fatal',
};

export class NestLogger extends ConsoleLogger {
	constructor() {
		super({
			// 整形はMisskey側のLogBackendが行うため、ConsoleLoggerによる着色は無効化する。
			colors: false,
			// ログ1件が複数行へ割れないよう、objectのinspectを1行へ収める。
			compact: true,
			logLevels: process.env.NODE_ENV === 'production'
				? LOG_LEVELS.filter(level => level !== 'debug' && level !== 'verbose')
				: [...LOG_LEVELS],
		});
	}

	protected override printMessages(
		messages: unknown[],
		context = '',
		logLevel: NestLogLevel = 'log',
		_writeStreamType?: 'stdout' | 'stderr',
		errorStack?: unknown,
		params?: Record<string, any>,
	): void {
		for (const message of messages) {
			// Errorはinspectするとstackが本文へ展開されるため、構造化したerrorへ寄せる
			const body = message instanceof Error
				? message.toString()
				: String(this.stringifyMessage(message, logLevel));

			const error = message instanceof Error
				? message
				: typeof errorStack === 'string'
					? { name: 'Error', message: body, stack: errorStack }
					: undefined;

			nestLogger.write({
				level: levelMap[logLevel],
				message: context === '' ? body : `${context}: ${body}`,
				...(error != null ? { error } : {}),
				...(params != null ? { attributes: params } : {}),
			});
		}
	}

	// ConsoleLogger.error()はprintMessages()の後にstackをprocess.stderrへ直接書く。
	// stackはprintMessages()で構造化したerrorへ載せているため、ここでは何もしない。
	protected override printStackTrace(): void {
	}
}
