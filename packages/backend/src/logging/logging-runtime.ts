/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { LogManager } from './LogManager.js';
import { BootstrapConsoleBackend } from './BootstrapConsoleBackend.js';
import { PrettyConsoleBackend } from './PrettyConsoleBackend.js';
import type { LogManagerConfiguration } from './LogManager.js';

/**
 * プロセス内のすべてのLoggerが共有するLogManagerです。
 * Logger作成後も同じLogManagerを参照するため、出力先の切り替えを一括で反映できます。
 */
export const logManager = new LogManager(new BootstrapConsoleBackend());

/** 設定読込後のlogging設定とPretty backendを適用します。 */
export function configureLogging(configuration?: LogManagerConfiguration): void {
	logManager.configure(configuration);
	logManager.setBackend(new PrettyConsoleBackend());
}

/** プロセス終了前に現在のlogging backendをflushして閉じます。 */
export function shutdownLogging(): Promise<void> {
	return logManager.shutdown();
}
