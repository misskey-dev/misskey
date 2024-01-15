/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import cluster from 'node:cluster';
import util from 'node:util';
import chalk from 'chalk';
import { default as convertColor } from 'color-convert';
import { format as dateFormat } from 'date-fns';
import { bindThis } from '@/decorators.js';
import { envOption } from './env.js';
import type { KEYWORD } from 'color-convert/conversions.js';

util.inspect.defaultOptions = envOption.logJson ? {
	showHidden: false,
	depth: null,
	colors: false,
	customInspect: true,
	showProxy: false,
	maxArrayLength: null,
	maxStringLength: null,
	breakLength: Infinity,
	compact: true,
	sorted: false,
	getters: false,
	numericSeparator: false,
} : {
	showHidden: false,
	depth: null,
	colors: true,
	customInspect: true,
	showProxy: false,
	maxArrayLength: null,
	maxStringLength: null,
	breakLength: Infinity,
	compact: true,
	sorted: false,
	getters: false,
	numericSeparator: false,
};

type Context = {
	name: string;
	color?: KEYWORD;
};

type Level = 'error' | 'success' | 'warning' | 'debug' | 'info';

function inspect(_: string, value: any): null | string | number | boolean {
	if (value === null || value === undefined) return null;
	if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return value;
	if (value instanceof Date) return value.toISOString();
	return util.inspect(value);
}

// eslint-disable-next-line import/no-default-export
export default class Logger {
	private context: Context;
	private parentLogger: Logger | null = null;
	private store: boolean;

	constructor(context: string, color?: KEYWORD, store = true) {
		this.context = {
			name: context,
			color: color,
		};
		this.store = store;
	}

	@bindThis
	public createSubLogger(context: string, color?: KEYWORD, store = true): Logger {
		const logger = new Logger(context, color, store);
		logger.parentLogger = this;
		return logger;
	}

	@bindThis
	private log(level: Level, message: string, data?: Record<string, any> | null, important = false, subContexts: Context[] = [], store = true): void {
		if (envOption.quiet && !envOption.logJson) return;
		if (!this.store) store = false;
		if (level === 'debug') store = false;

		if (this.parentLogger) {
			this.parentLogger.log(level, message, data, important, [this.context].concat(subContexts), store);
			return;
		}

		if (envOption.logJson) {
			console.log(JSON.stringify({
				time: new Date().toISOString(),
				level: level,
				message: message,
				data: data,
				important: important,
				context: [this.context].concat(subContexts).map(d => d.name).join('.'),
				cluster: cluster.isPrimary ? 'primary' : `worker-${cluster.worker!.id}`,
			}, inspect));
			return;
		}

		const time = dateFormat(new Date(), 'HH:mm:ss');
		const worker = cluster.isPrimary ? '*' : cluster.worker!.id;
		const l =
			level === 'error' ? important ? chalk.bgRed.white('ERR ') : chalk.red('ERR ') :
			level === 'warning' ? chalk.yellow('WARN') :
			level === 'success' ? important ? chalk.bgGreen.white('DONE') : chalk.green('DONE') :
			level === 'debug' ? chalk.gray('VERB') :
			level === 'info' ? chalk.blue('INFO') :
			null;
		const contexts = [this.context].concat(subContexts).map(d => d.color ? chalk.rgb(...convertColor.keyword.rgb(d.color))(d.name) : chalk.white(d.name));
		const m =
			level === 'error' ? chalk.red(message) :
			level === 'warning' ? chalk.yellow(message) :
			level === 'success' ? chalk.green(message) :
			level === 'debug' ? chalk.gray(message) :
			level === 'info' ? message :
			null;

		let log = `${l} ${worker}\t[${contexts.join(' ')}]\t${m}`;
		if (envOption.withLogTime) log = chalk.gray(time) + ' ' + log;

		const args: unknown[] = [important ? chalk.bold(log) : log];
		if (data != null) {
			args.push(JSON.stringify(data, inspect, 2));
		}

		if (level === 'error' || level === 'warning') {
			console.error(...args);
		} else {
			console.log(...args);
		}
	}

	@bindThis
	public error(x: string | Error, data?: Record<string, any> | null, important = false): void { // 実行を継続できない状況で使う
		if (x instanceof Error) {
			data = data ?? {};
			data.error = x;

			this.log('error', x.toString(), data, important);
		} else if (typeof x === 'object') {
			data = data ?? {};
			data.error = data.error ?? x;

			this.log('error', `${(x as any).message ?? (x as any).name ?? x}`, data, important);
		} else {
			this.log('error', `${x}`, data, important);
		}
	}

	@bindThis
	public warn(x: string | Error, data?: Record<string, any> | null, important = false): void { // 実行を継続できるが改善すべき状況で使う
		if (x instanceof Error) {
			data = data ?? {};
			data.error = x;

			this.log('warning', x.toString(), data, important);
		} else if (typeof x === 'object') {
			data = data ?? {};
			data.error = data.error ?? x;

			this.log('warning', `${(x as any).message ?? (x as any).name ?? x}`, data, important);
		} else {
			this.log('warning', `${x}`, data, important);
		}
	}

	@bindThis
	public succ(message: string, data?: Record<string, any> | null, important = false): void { // 何かに成功した状況で使う
		this.log('success', message, data, important);
	}

	@bindThis
	public debug(message: string, data?: Record<string, any> | null, important = false): void { // デバッグ用に使う(開発者に必要だが利用者に不要な情報)
		if (process.env.NODE_ENV !== 'production' || envOption.verbose) {
			this.log('debug', message, data, important);
		}
	}

	@bindThis
	public info(message: string, data?: Record<string, any> | null, important = false): void { // それ以外
		this.log('info', message, data, important);
	}
}
