/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Config } from '@/config.js';
import { OpenTelemetryAdapter } from './adapters/OpenTelemetryAdapter.js';
import { SentryTelemetryAdapter } from './adapters/SentryTelemetryAdapter.js';
import type { OtelBackendRuntimeConfig, TelemetryAdapter, TelemetryCaptureMessageOptions } from './adapters/TelemetryAdapter.js';

/**
 * NestのDIコンテナが構築される前(boot処理内)で初期化する必要があるため、
 * DIを介さないモジュールレベルの状態として有効なアダプタを保持する。
 * TelemetryServiceはこの状態への薄いラッパーとして振る舞う。
 */
const adapters: TelemetryAdapter[] = [];

export async function initTelemetry(config: Config): Promise<void> {
	const otelForBackend: OtelBackendRuntimeConfig | undefined = config.otelForBackend == null ? undefined : {
		...config.otelForBackend,
		serviceVersion: config.version,
	};

	// SentryとOTelを同時に使う場合はproviderを分けず、Sentry側へOTLP processorを追加する。
	if (config.sentryForBackend && otelForBackend) {
		adapters.push(await SentryTelemetryAdapter.createWithOtlpExport(config.sentryForBackend, otelForBackend));
	} else if (config.sentryForBackend) {
		// Sentry単体時は既存のSentry adapterだけを登録する。
		adapters.push(await SentryTelemetryAdapter.create(config.sentryForBackend));
	} else if (otelForBackend) {
		// OTel単体時だけMisskey自身でNodeTracerProviderを立てる。
		adapters.push(await OpenTelemetryAdapter.create(otelForBackend));
	}
}

export function captureMessage(message: string, opts: TelemetryCaptureMessageOptions): void {
	// 有効なadapterすべてへ通知し、宛先ごとの差異はadapter内に閉じ込める。
	for (const adapter of adapters) {
		adapter.captureMessage(message, opts);
	}
}

export function startSpan<T>(name: string, fn: () => T): T {
	// 有効なadapterが無い/1つだけの場合(実運用上の大半のケース)は、
	// 毎リクエスト/ジョブでreduceRightのclosureを組み立てる無駄を避ける。
	if (adapters.length === 0) return fn();
	if (adapters.length === 1) return adapters[0].startSpan(name, fn);

	// 将来複数adapterを登録する場合でも同じ処理を入れ子にラップし、呼び出し側のAPIは1回のstartSpanに保つ。
	const wrapped = adapters.reduceRight<() => T>(
		(inner, adapter) => () => adapter.startSpan(name, inner),
		fn,
	);
	return wrapped();
}

export async function shutdownTelemetry(): Promise<void> {
	// 終了時は登録済みadapterを並列にflush/shutdownする。
	await Promise.allSettled(adapters.map(adapter => adapter.shutdown()));
}
