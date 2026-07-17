/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { LogManager } from './LogManager.js';
import { BootstrapConsoleBackend } from './BootstrapConsoleBackend.js';
import { JsonConsoleBackend } from './JsonConsoleBackend.js';
import { PrettyConsoleBackend } from './PrettyConsoleBackend.js';
import type { LogManagerConfiguration } from './LogManager.js';
import type { LogBackend } from './LogBackend.js';
import type { LogFormat } from './types.js';

/**
 * プロセス内のすべてのLoggerが共有するLogManagerです。
 * Logger作成後も同じLogManagerを参照するため、出力先の切り替えを一括で反映できます。
 */
export const logManager = new LogManager(new BootstrapConsoleBackend());

/** ログ形式を検証し、指定された形式に対応する出力処理を作成します。 */
function createLoggingBackend(format: unknown): LogBackend {
	if (format == null || format === 'pretty') return new PrettyConsoleBackend();
	if (format === 'json') return new JsonConsoleBackend();
	throw new Error('logging.format must be either pretty or json');
}

/** 起動時のログ設定を適用し、選択した出力処理へ切り替えます。 */
export function configureLogging(configuration?: LogManagerConfiguration & { readonly format?: LogFormat }): void {
	// 出力処理を先に検証し、設定値が不正な場合は現在の出力処理を壊さないようにします。
	const backend = createLoggingBackend(configuration?.format);
	logManager.configure(configuration);
	logManager.setBackend(backend);
}

/** プロセス終了前に現在のログ出力処理を保留分まで書き出して閉じます。 */
export function shutdownLogging(): Promise<void> {
	return logManager.shutdown();
}
