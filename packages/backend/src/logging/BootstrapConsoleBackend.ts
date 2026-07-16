/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { LogBackend } from './LogBackend.js';
import type { LogRecord } from './types.js';

/** 設定読込前の最小出力処理が外部から受け取る依存関係です。 */
export type BootstrapConsoleBackendDependencies = {
	readonly output: (...args: unknown[]) => void;
};

const defaultDependencies: BootstrapConsoleBackendDependencies = {
	output: (...args) => console.log(...args),
};

/**
 * 設定読込前でも利用できる、依存の少ないコンソール出力です。
 * 設定ファイルの読み込み失敗を報告するため、Pretty backendやTelemetryには依存しません。
 */
export class BootstrapConsoleBackend implements LogBackend {
	private readonly dependencies: BootstrapConsoleBackendDependencies;

	constructor(dependencies: Partial<BootstrapConsoleBackendDependencies> = {}) {
		this.dependencies = {
			...defaultDependencies,
			...dependencies,
		};
	}

	public write(record: LogRecord): void {
		const worker = record.isPrimary ? '*' : record.workerId ?? '?';
		const line = `${record.timestamp} ${record.level.toUpperCase()} ${worker}\t[${record.loggerName}]\t${record.message}`;
		const args: unknown[] = [line];

		if (record.compatibility?.data != null) {
			args.push(record.compatibility.data);
		} else if (record.eventName != null || record.attributes != null || record.error != null) {
			args.push({
				...(record.eventName != null ? { eventName: record.eventName } : {}),
				...(record.attributes != null ? { attributes: record.attributes } : {}),
				...(record.error != null ? { error: record.error } : {}),
			});
		}

		this.dependencies.output(...args);
	}
}
