/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Config } from '@/config.js';
import type { FastifyInstance } from 'fastify';

type TelemetryConfig = Pick<Config, 'otelForBackend' | 'sentryForBackend'>;

export function shouldRegisterHttpServerInstrumentation(config: TelemetryConfig): boolean {
	// Sentry併用時はSentry側のtracingを無効化しOTelがspanを所有するため、Sentryの有無にかかわらず登録する。
	return config.otelForBackend != null;
}

/**
 * すべてのルート・フックより前にリクエスト計装を登録し、ActivityPubや
 * well-knownを含む全HTTP受信経路を1つのroot spanとして計測する。
 */
export async function registerHttpServerInstrumentation(fastify: FastifyInstance, config: TelemetryConfig): Promise<void> {
	if (!shouldRegisterHttpServerInstrumentation(config)) return;

	const { FastifyOtelInstrumentation } = await import('@fastify/otel');
	const instrumentation = new FastifyOtelInstrumentation({
		requestHook: (span, request) => {
			const route = request.routeOptions.url;
			if (route != null) {
				// デフォルトだとトレース名が「request」で固定されてしまうため、判別がつかなくなる。
				// ルート名をspan名に設定することで、トレースビューでルートごとの処理時間を確認できるようになる。
				span.updateName(`${request.method} ${route}`);
			}
		},
	});
	await fastify.register(instrumentation.plugin());
}
