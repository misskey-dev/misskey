/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as process from 'node:process';

const debug = process.env.BUILDER_DEBUG !== undefined && process.env.BUILDER_DEBUG !== '0';

export interface Logger {
	debug(message: string): void;

	warn(message: string): void;

	error(message: string): void;

	info(message: string): void;

	prefixed(newPrefix: string): Logger;
}

interface RootLogger extends Logger {
	warningCount: number;
	errorCount: number;
}

export function createLogger(): RootLogger {
	return loggerFactory('', {
		warningCount: 0,
		errorCount: 0,
	});
}

type LogContext = {
	warningCount: number;
	errorCount: number;
};

function loggerFactory(prefix: string, context: LogContext): RootLogger {
	return {
		debug: (message: string) => {
			if (debug) console.log(`[DBG] ${prefix}${message}`);
		},
		warn: (message: string) => {
			context.warningCount++;
			console.log(`${debug ? '[WRN]' : 'w:'} ${prefix}${message}`);
		},
		error: (message: string) => {
			context.errorCount++;
			console.error(`${debug ? '[ERR]' : 'e:'} ${prefix}${message}`);
		},
		info: (message: string) => {
			console.error(`${debug ? '[INF]' : 'i:'} ${prefix}${message}`);
		},
		prefixed: (newPrefix: string) => {
			return loggerFactory(`${prefix}${newPrefix}`, context);
		},
		get warningCount() {
			return context.warningCount;
		},
		get errorCount() {
			return context.errorCount;
		},
	};
}

export const blankLogger: Logger = {
	debug: () => void 0,
	warn: () => void 0,
	error: () => void 0,
	info: () => void 0,
	prefixed: () => blankLogger,
};
