/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { bindThis } from '@/decorators.js';
import { logManager } from './logging/logging-runtime.js';
import type { LogLevel, LoggerContext, LogWriteInput } from './logging/types.js';
import type { Keyword } from 'color-convert';

/**
 * ロガー名の階層と従来の公開APIを提供する薄い窓口です。
 * 出力条件の判断や整形はLogManagerとLogBackendへ委譲します。
 */
// eslint-disable-next-line import/no-default-export
export default class Logger {
	private context: readonly LoggerContext[];

	/** 指定した名前を起点とするLoggerを作成します。 */
	constructor(context: string, color?: Keyword) {
		this.context = [{
			name: context,
			color,
		}];
	}

	/**
	 * 現在のロガーを親として、下位の名前を持つLoggerを作成します。
	 */
	@bindThis
	public createSubLogger(context: string, color?: Keyword): Logger {
		const logger = new Logger(context, color);
		logger.context = [...this.context, ...logger.context];
		return logger;
	}

	/**
	 * 従来APIの引数を共通形式へ変換し、LogManagerへ渡します。
	 */
	@bindThis
	private log(level: LogLevel, message: string, data?: unknown, important = false, legacyLevel?: 'success', error?: unknown): void {
		logManager.write({
			level,
			message,
			context: this.context,
			...(typeof error !== 'undefined' ? { error } : {}),
			compatibility: {
				legacyLevel,
				important,
				data,
			},
		});
	}

	/** 構造化ログをLoggerのcontext付きでLogManagerへ渡します。 */
	@bindThis
	public write(input: LogWriteInput): void {
		logManager.write({
			...input,
			context: this.context,
		});
	}

	/** 処理を継続できない状況を記録します。 */
	@bindThis
	public error(x: string | Error, data?: Record<string, any> | null, important = false): void {
		if (x instanceof Error) {
			// エラー本体も第2引数へ残し、従来どおりスタックなどを確認できるようにします。
			data = data ?? {};
			data.e = x;
			this.log('error', x.toString(), data, important, undefined, x);
		} else if (typeof x === 'object') {
			this.log('error', `${(x as any).message ?? (x as any).name ?? x}`, data, important);
		} else {
			this.log('error', `${x}`, data, important);
		}
	}

	/** 処理は継続できるものの、改善が必要な状況を記録します。 */
	@bindThis
	public warn(message: string, data?: Record<string, any> | null, important = false): void {
		this.log('warn', message, data, important);
	}

	/** 処理が成功したことを、従来のDONE表示で記録します。 */
	@bindThis
	public succ(message: string, data?: Record<string, any> | null, important = false): void {
		this.log('info', message, data, important, 'success');
	}

	/** 開発者向けの調査情報を記録します。 */
	@bindThis
	public debug(message: string, data?: Record<string, any> | null, important = false): void {
		this.log('debug', message, data, important);
	}

	/** 通常の動作状況を記録します。 */
	@bindThis
	public info(message: string, data?: Record<string, any> | null, important = false): void {
		this.log('info', message, data, important);
	}
}
