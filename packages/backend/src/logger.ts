/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import cluster from 'node:cluster';
import { pino } from 'pino';
import pinoPretty from 'pino-pretty';
import { bindThis } from '@/decorators.js';
import { envOption } from './env.js';
import type { KEYWORD } from 'color-convert/conversions.js';

const pinoPrettyStream = pinoPretty({
	levelFirst: false,
	levelKey: 'level',
	timestampKey: 'time',
	messageKey: 'message',
	errorLikeObjectKeys: ['e', 'err', 'error'],
	ignore: 'severity,pid,hostname,cluster,important',
	messageFormat: '@{cluster} | {message}',
});

// eslint-disable-next-line import/no-default-export
export default class Logger {
	private readonly domain: string | undefined;
	private readonly logger: pino.Logger;
	private context: Record<string, any> = {};

	constructor(domain: string | undefined, _color?: KEYWORD, _store = true, parentLogger?: Logger) {
		if (parentLogger) {
			this.domain = [parentLogger.domain, domain].filter(x => x).join('.') || undefined;
			this.context = { ...JSON.parse(JSON.stringify(parentLogger.context)) };
		} else {
			this.domain = domain;
		}

		this.logger = pino({
			name: this.domain,
			serializers: {
				...pino.stdSerializers,
				err: pino.stdSerializers.errWithCause,
			},
			level: envOption.verbose ? 'debug' : 'info',
			depthLimit: 8,
			edgeLimit: 128,
			redact: ['context.password', 'context.token'],
			enabled: !envOption.quiet || envOption.logJson,
			timestamp: envOption.withLogTime || envOption.logJson ? pino.stdTimeFunctions.isoTime : false,
			messageKey: 'message',
			errorKey: 'error',
			formatters: {
				level: (label, number) => ({ severity: label, level: number }),
			},
			mixin: () => this.mixin(),
		}, !envOption.logJson ? pinoPrettyStream : undefined);
	}

	private mixin(): Record<string, any> {
		return { cluster: cluster.isPrimary ? 'primary' : `worker#${cluster.worker!.id}`, ...this.context };
	}

	public createSubLogger(domain?: string, _color?: KEYWORD, _store = true): Logger {
		return new Logger(domain, _color, _store, this);
	}

	public setContext(context: Record<string, any>): void {
		this.context = { ...this.context, ...JSON.parse(JSON.stringify(context)) };
	}

	@bindThis
	public error(x: string | Error, context?: Record<string, any> | null, important = false): void { // 実行を継続できない状況で使う
		// eslint-disable-next-line no-param-reassign
		if (context === null) context = undefined;
		if (context?.error) context.error = pino.stdSerializers.errWithCause(context.error);

		if (x instanceof Error) {
			// eslint-disable-next-line no-param-reassign
			if (context?.error === undefined) context = { ...context, error: pino.stdSerializers.errWithCause(x) };

			if (important) this.logger.fatal({ context, important }, x.toString());
			else this.logger.error({ context, important }, x.toString());
		} else if (typeof x === 'object') {
			// eslint-disable-next-line no-param-reassign
			if (context?.error === undefined) context = { ...context, error: pino.stdSerializers.errWithCause(x) };

			if (important) this.logger.fatal({ context, important }, `${(x as any).message ?? (x as any).name ?? x}`);
			else this.logger.error({ context, important }, `${(x as any).message ?? (x as any).name ?? x}`);
		} else {
			if (important) this.logger.fatal({ context, important }, x);
			else this.logger.error({ context, important }, x);
		}
	}

	@bindThis
	public warn(x: string | Error, context?: Record<string, any> | null, important = false): void { // 実行を継続できるが改善すべき状況で使う
		// eslint-disable-next-line no-param-reassign
		if (context === null) context = undefined;
		if (context?.error) context.error = pino.stdSerializers.errWithCause(context.error);

		if (x instanceof Error) {
			// eslint-disable-next-line no-param-reassign
			if (context?.error === undefined) context = { ...context, error: pino.stdSerializers.errWithCause(x) };

			this.logger.warn({ context, important }, x.toString());
		} else if (typeof x === 'object') {
			// eslint-disable-next-line no-param-reassign
			if (context?.error === undefined) context = { ...context, error: pino.stdSerializers.errWithCause(x) };

			this.logger.warn({ context, important }, `${(x as any).message ?? (x as any).name ?? x}`);
		} else {
			this.logger.warn({ context, important }, x);
		}
	}

	@bindThis
	public succ(message: string, context?: Record<string, any> | null, important = false): void { // 何かに成功した状況で使う
		if (context === null) context = undefined;

		this.logger.trace({ context, important }, message);
	}

	@bindThis
	public debug(message: string, context?: Record<string, any> | null, important = false): void { // デバッグ用に使う(開発者に必要だが利用者に不要な情報)
		if (context === null) context = undefined;

		this.logger.debug({ context, important }, message);
	}

	@bindThis
	public info(message: string, context?: Record<string, any> | null, important = false): void { // それ以外
		if (context === null) context = undefined;

		this.logger.info({ context, important }, message);
	}
}

export const rootLogger = new Logger(undefined, undefined, false, undefined);
export const coreLogger = rootLogger.createSubLogger('core', 'cyan');
