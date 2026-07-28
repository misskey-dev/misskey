/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Config } from '@/config.js';
import type { FastifyInstance } from 'fastify';

type TelemetryConfig = Pick<Config, 'otelForBackend' | 'sentryForBackend'>;

export function shouldRegisterHttpServerInstrumentation(config: TelemetryConfig): boolean {
	// Sentryもリクエストspanを作成するため、両方を登録すると重複して出力される。
	return config.otelForBackend != null && config.sentryForBackend == null;
}

/**
 * すべてのルート・フックより前にリクエスト計装を登録し、ActivityPubや
 * well-knownを含む全HTTP受信経路を1つのroot spanとして計測する。
 */
export async function registerHttpServerInstrumentation(fastify: FastifyInstance, config: TelemetryConfig): Promise<void> {
	if (!shouldRegisterHttpServerInstrumentation(config)) {
		return;
	}

	const { FastifyOtelInstrumentation } = await import('@fastify/otel');
	const instrumentation = new FastifyOtelInstrumentation({
		// lifecycle hook の span も作る。hook 名と関数名・プラグイン名だけを材料にするため
		// route や path を含まず、root span との差分から hook 区間の所要時間を追える。
		requestHook: (span, request) => {
			const route = request.routeOptions.url;
			if (route != null) {
				// デフォルトだとトレース名が「request」で固定されてしまうため、判別がつかなくなる。
				// ルート名をspan名に設定することで、トレースビューでルートごとの処理時間を確認できるようになる。
				span.updateName(`${request.method} ${route}`);
				// credential を含みうる生 path は追加せず、計装済みの route template だけを残す。
			}
		},
	});
	await fastify.register(instrumentation.plugin());
}
