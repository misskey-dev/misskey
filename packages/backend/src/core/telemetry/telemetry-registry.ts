/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Config } from '@/config.js';
import { SentryTelemetryAdapter } from './adapters/SentryTelemetryAdapter.js';
import type { TelemetryAdapter, TelemetryCaptureMessageOptions } from './adapters/TelemetryAdapter.js';

/**
 * NestのDIコンテナが構築される前(boot処理内)で初期化する必要があるため、
 * DIを介さないモジュールレベルの状態として有効なアダプタを保持する。
 * TelemetryServiceはこの状態への薄いラッパーとして振る舞う。
 */
const adapters: TelemetryAdapter[] = [];

export async function initTelemetry(config: Config): Promise<void> {
	if (config.sentryForBackend) {
		adapters.push(await SentryTelemetryAdapter.create(config.sentryForBackend));
	}
}

export function captureMessage(message: string, opts: TelemetryCaptureMessageOptions): void {
	for (const adapter of adapters) {
		adapter.captureMessage(message, opts);
	}
}

export function startSpan<T>(name: string, fn: () => T): T {
	const wrapped = adapters.reduceRight<() => T>(
		(inner, adapter) => () => adapter.startSpan(name, inner),
		fn,
	);
	return wrapped();
}

export async function shutdownTelemetry(): Promise<void> {
	await Promise.all(adapters.map(adapter => adapter.shutdown()));
}
