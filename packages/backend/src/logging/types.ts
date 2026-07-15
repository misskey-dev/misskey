/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Keyword } from 'color-convert';

/** ログの重要度を表します。 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

/**
 * ロガー名を構成する一要素です。
 * 色はPretty形式での表示だけに使い、ログの意味には影響させません。
 */
export type LoggerContext = {
	readonly name: string;
	readonly color?: Keyword;
};

/**
 * 従来のコンソール表示を維持するための情報です。
 * 構造化ログの項目と混同しないよう、互換用の領域へ分離しています。
 */
export type LogCompatibility = {
	readonly legacyLevel?: 'success';
	readonly important?: boolean;
	readonly data?: Record<string, unknown> | null;
};

/**
 * 呼び出し側からLogManagerへ渡す、時刻などを付加する前のログです。
 */
export type LogRecordInput = {
	readonly level: LogLevel;
	readonly message: string;
	readonly context: readonly LoggerContext[];
	readonly compatibility?: LogCompatibility;
};

/**
 * 出力先へ渡すログです。
 * LogManagerが時刻やプロセス情報を付加するため、出力形式に依存せず利用できます。
 */
export type LogRecord = LogRecordInput & {
	readonly timestamp: string;
	readonly loggerName: string;
	readonly processId: number;
	readonly isPrimary: boolean;
	readonly workerId: number | null;
};
