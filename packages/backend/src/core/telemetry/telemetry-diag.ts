/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import Logger from '@/logger.js';
import type { DiagAPI, DiagLogger, DiagLogLevel } from '@opentelemetry/api';

export function registerDiagLogger(
	diagApi: DiagAPI,
	diagLogLevelWarn: DiagLogLevel,
): void {
	// diagはプロセスグローバルなので、通常運用で必要なWARN以上だけをMisskeyのログに流す。
	const logger = new Logger('otel', 'green');
	const diagLogger: DiagLogger = {
		error: (message, ...args) => logger.error(formatDiagMessage(message, args)),
		warn: (message, ...args) => logger.warn(formatDiagMessage(message, args)),
		info: (message, ...args) => logger.info(formatDiagMessage(message, args)),
		debug: (message, ...args) => logger.debug(formatDiagMessage(message, args)),
		verbose: (message, ...args) => logger.debug(formatDiagMessage(message, args)),
	};

	diagApi.setLogger(diagLogger, {
		logLevel: diagLogLevelWarn,
		suppressOverrideMessage: true,
	});
}

function formatDiagMessage(message: string, args: unknown[]): string {
	if (args.length === 0) return message;
	return `${message} ${args.map(arg => {
		if (arg instanceof Error) return arg.stack ?? arg.message;
		if (typeof arg === 'string') return arg;
		try {
			return JSON.stringify(arg);
		} catch {
			return String(arg);
		}
	}).join(' ')}`;
}
