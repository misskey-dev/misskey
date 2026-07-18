/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Keyword } from 'color-convert';

/** ログの重要度を表します。 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

/** 設定で指定できるログの閾値です。`off`はログイベントのlevelには使用しません。 */
export type LogLevelSetting = LogLevel | 'off';

/** コンソールへ出すログ形式です。未指定時は見やすい形式を使用します。 */
export type LogFormat = 'pretty' | 'json';

/** 正規化後にログ属性として扱えるJSONの値です。 */
export type LogAttributeValue =
	| string
	| number
	| boolean
	| null
	| readonly LogAttributeValue[]
	| { readonly [key: string]: LogAttributeValue };

/** 正規化後のログ属性です。 */
export type LogAttributes = Readonly<Record<string, LogAttributeValue>>;

/** ロガーの呼び出し側が構造化ログとして指定する入力です。 */
export type LogWriteInput = {
	readonly level: LogLevel;
	readonly message: string;
	readonly eventName?: string;
	readonly attributes?: Readonly<Record<string, unknown>>;
	readonly error?: unknown;
};

/**
 * ロガー名を構成する一要素です。
 * 色は見やすい形式での表示だけに使い、ログの意味には影響させません。
 */
export type LoggerContext = {
	readonly name: string;
	readonly color?: Keyword;
};

/**
 * 従来のコンソール表示を維持するための情報です。
 * 構造化ログの項目と混同しないよう、互換用の領域へ分離しています。
 * `data`は従来表示を保つため正規化せず、秘匿が必要な値は構造化属性へ移します。
 */
export type LogCompatibility = {
	readonly legacyLevel?: 'success';
	readonly important?: boolean;
	readonly data?: unknown;
};

/**
 * 呼び出し側からLogManagerへ渡す、時刻などを付加する前のログです。
 */
export type LogRecordInput = LogWriteInput & {
	readonly context: readonly LoggerContext[];
	readonly compatibility?: LogCompatibility;
};

/** エラーをJSONへ出力するために正規化した形です。 */
export type SerializedError = {
	readonly type: string;
	readonly message: string;
	readonly stack?: string;
	readonly cause?: SerializedError | LogAttributeValue;
};

/**
 * 出力先へ渡すログです。
 * `compatibility.data`は見やすい形式だけが使う従来値で、構造化した出力先は属性とエラーを利用します。
 */
export type LogRecord = Omit<LogRecordInput, 'attributes' | 'error'> & {
	readonly timestamp: string;
	readonly loggerName: string;
	readonly processId: number;
	readonly isPrimary: boolean;
	readonly workerId: number | null;
	readonly attributes?: LogAttributes;
	readonly error?: SerializedError;
};
