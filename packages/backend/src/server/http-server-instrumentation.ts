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

	const sentryConfig = config.sentryForBackend;
	if (sentryConfig == null || sentryConfig.options.enabled === false || sentryConfig.disabledIntegrations?.includes('Fastify')) return;
	const defaults = sentryConfig.options.defaultIntegrations;
	if (defaults === false || (Array.isArray(defaults) && !defaults.some(integration => integration.name === 'Fastify'))) return;

	// Sentry v11's Fastify integration owns both spans and error capture. Its request
	// decorator conflicts with @fastify/otel, so linked mode replaces only error capture.
	const Sentry = await import('@sentry/node');
	const capturedRequests = new WeakSet<object>();
	fastify.addHook('onError', async (request, reply, error) => {
		if (capturedRequests.has(request)) return;
		// onError may run before Fastify assigns the error's HTTP status to the reply.
		// Match Sentry v11's Fastify defaultShouldHandleError, including its fallback.
		const errorStatus = Number(error.statusCode || ('status' in error ? error.status : undefined));
		const statusCode = reply.statusCode !== 200 ? reply.statusCode : errorStatus >= 400 ? errorStatus : 500;
		if (statusCode >= 300 && statusCode < 500) return;
		capturedRequests.add(request);
		Sentry.withScope(scope => {
			scope.setTransactionName(`${request.method} ${request.routeOptions.url ?? '/'}`);
			Sentry.captureException(error, {
				mechanism: { handled: false, type: 'auto.function.fastify' },
			});
		});
	});
}
