/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as http from 'node:http';
import { gunzipSync } from 'node:zlib';
import { setTimeout as delay } from 'node:timers/promises';
import { trace } from '@opentelemetry/api';
import * as Sentry from '@sentry/node';
import { captureMessage, initTelemetry, injectTraceContext, shutdownTelemetry, startSpan, startSpanWithTraceContext } from '@/core/telemetry/telemetry-registry.js';
import { runQueueJobWithTraceContext } from '@/queue/queue-job-runner.js';
import { registerHttpServerInstrumentation } from '@/server/http-server-instrumentation.js';
import { logManager } from '@/logging/logging-runtime.js';
import type { Config } from '@/config.js';
import type { SpanContext } from '@opentelemetry/api';
import type { ReadableSpan } from '@opentelemetry/sdk-trace';

export type RuntimeScenario = 'none' | 'sentry' | 'otel' | 'linked' | 'environment' | 'unsampled' | 'disabled' | 'fastify-disabled' | 'http-disabled' | 'profile' | 'queue-parent' | 'queue-link' | 'stalled'
	| 'sentry-defaults-false' | 'sentry-defaults-empty' | 'linked-defaults-false' | 'linked-defaults-empty' | 'linked-defaults-selected';

export type TelemetryRuntimeResult = {
	events: Sentry.Event[];
	contexts: Record<string, { otel?: SpanContext; sentry?: SpanContext; log?: { traceId: string; spanId: string }; parent?: SpanContext; links?: SpanContext[] }>;
	requests: { path: string; headers: http.IncomingHttpHeaders; body: string }[];
	itemTypes: string[];
	statuses: Record<string, number>;
	integrations: string[];
	environment?: string;
	shutdownMs: number;
};

const scenario = process.argv[2] as RuntimeScenario;
const result: TelemetryRuntimeResult = { events: [], contexts: {}, requests: [], itemTypes: [], statuses: {}, integrations: [], shutdownMs: 0 };
const collector = http.createServer(async (request, response) => {
	const chunks: Buffer[] = [];
	for await (const chunk of request) chunks.push(Buffer.from(chunk));
	const encoded = Buffer.concat(chunks);
	const body = request.headers['content-encoding'] === 'gzip' ? gunzipSync(encoded) : encoded;
	result.requests.push({ path: request.url ?? '/', headers: request.headers, body: request.url?.includes('/envelope/') ? '' : body.toString('latin1') });
	if (request.url?.includes('/envelope/')) {
		const lines = body.toString('utf8').split('\n');
		for (let i = 1; i < lines.length - 1; i += 2) {
			const header = JSON.parse(lines[i]) as { type: string };
			result.itemTypes.push(header.type);
			if (header.type === 'event') result.events.push(JSON.parse(lines[i + 1]) as Sentry.Event);
		}
	}
	if (scenario !== 'stalled') response.end('{}');
});
await new Promise<void>(resolve => collector.listen(0, '127.0.0.1', resolve));
const collectorPort = (collector.address() as { port: number }).port;
const baseUrl = `http://127.0.0.1:${collectorPort}`;
const hasSentry = scenario !== 'none' && scenario !== 'otel';
const hasOtel = scenario !== 'none' && scenario !== 'sentry' && !scenario.startsWith('sentry-defaults-');
const config = {
	version: 'telemetry-test',
	...(hasOtel ? { otelForBackend: {
		endpoint: `${baseUrl}/v1/traces`,
		sampleRate: scenario === 'unsampled' ? 0 : 1,
		jobTraceContextMode: scenario === 'queue-parent' ? 'parent' : 'link',
	} } : {}),
	...(hasSentry ? { sentryForBackend: {
		enableNodeProfiling: scenario === 'profile' || scenario === 'sentry',
		disabledIntegrations: scenario === 'fastify-disabled' ? ['Fastify'] : scenario === 'http-disabled' ? ['Http', 'NodeFetch'] : [],
		options: {
			dsn: `http://public@127.0.0.1:${collectorPort}/1`,
			enabled: scenario !== 'disabled',
			...(scenario.endsWith('defaults-false') ? { defaultIntegrations: false as const } : {}),
			...(scenario.endsWith('defaults-empty') ? { defaultIntegrations: [] } : {}),
			...(scenario === 'linked-defaults-selected' ? { defaultIntegrations: [
				Sentry.httpIntegration(),
				Sentry.nativeNodeFetchIntegration(),
				Sentry.fastifyIntegration(),
				Sentry.postgresIntegration(),
				{ name: 'TestErrorProcessor', processEvent: (event: Sentry.Event) => ({ ...event, tags: { ...event.tags, 'review.selected': true } }) },
			] } : {}),
			beforeSend: (event: Sentry.ErrorEvent) => {
				// Fastify's onError hook has its own OTel span, distinct from the throwing handler.
				saveContext(`event:${event.event_id}`);
				event.tags = { ...event.tags, 'review.filtered': true };
				return event;
			},
			...(scenario === 'environment' ? {
				tracesSampleRate: 1,
				tracesSampler: () => 1,
				enableOpenTelemetrySetup: true,
				tracePropagationTargets: ['.*'],
			} : {}),
		},
	} } : {}),
} as Config;

function saveContext(id: string): void {
	const span = trace.getActiveSpan();
	result.contexts[id] = {
		otel: span?.spanContext(),
		sentry: Sentry.getActiveSpan()?.spanContext(),
		log: logManager.getActiveTraceContext(),
		parent: (span as ReadableSpan | undefined)?.parentSpanContext,
		links: (span as ReadableSpan | undefined)?.links?.map(link => link.context),
	};
}

async function get(url: string): Promise<number> {
	return new Promise((resolve, reject) => {
		http.get(url, response => {
			response.resume();
			response.on('end', () => resolve(response.statusCode ?? 0));
		}).on('error', reject);
	});
}

try {
	await initTelemetry(config);
	result.integrations = Sentry.getClient()?.getOptions().integrations.map(integration => integration.name) ?? [];
	const fastify = (await import('fastify')).default();
	await registerHttpServerInstrumentation(fastify, config);
	fastify.addHook('onRequest', async request => {
		if (request.url.startsWith('/hook-error')) {
			saveContext('hook-error');
			throw new Error('hook-error');
		}
	});
	fastify.get('/hook-error', async () => 'unreachable');
	fastify.get('/sync-error', () => {
		saveContext('sync-error');
		throw new Error('sync-error');
	});
	fastify.get('/async-error', async () => {
		await delay(1);
		saveContext('async-error');
		throw new Error('async-error');
	});
	fastify.get('/client-error', async () => {
		throw Object.assign(new Error('client-error'), { statusCode: 400 });
	});
	fastify.get('/status-error', async (_request, reply) => {
		reply.code(503);
		saveContext('status-error');
		throw new Error('status-error');
	});
	fastify.post('/private', async () => {
		saveContext('private-error');
		throw new Error('private-error');
	});
	fastify.get('/parallel/:id', async request => startSpan('endpoint', async () => {
		const id = (request.params as { id: string }).id;
		Sentry.setTag('review.id', id);
		Sentry.setUser({ id });
		await delay(id === 'a' ? 15 : 1);
		saveContext(id);
		captureMessage(`request-${id}`, { level: 'error' });
		await get(`${baseUrl}/outbound?i=private-token`);
		await fetch(`${baseUrl}/fetch?i=private-token`);
		return 'ok';
	}));
	await fastify.listen({ port: 0, host: '127.0.0.1' });
	const appUrl = `http://127.0.0.1:${(fastify.server.address() as { port: number }).port}`;
	if (scenario !== 'stalled') {
		await Promise.all(['a', 'b'].map(id => get(`${appUrl}/parallel/${id}?i=private-token`)));
		for (const route of ['sync-error', 'async-error', 'hook-error', 'client-error', 'status-error']) {
			result.statuses[route] = await get(`${appUrl}/${route}`);
		}
		await new Promise<void>((resolve, reject) => {
			const request = http.request(`${appUrl}/private?i=private-token`, {
				method: 'POST',
				headers: { authorization: 'Bearer private-token', cookie: 'session=private-token', 'content-type': 'application/json' },
			}, response => {
				response.resume();
				response.on('end', () => resolve());
			});
			request.on('error', reject);
			request.end(JSON.stringify({ i: 'private-token', note: 'private-note-content' }));
		});
	} else {
		startSpan('shutdown-span', () => captureMessage('shutdown-message', { level: 'error' }));
	}

	if (scenario.startsWith('queue-')) {
		const carrier: Record<string, string> = {};
		startSpan('enqueue', () => {
			saveContext('enqueue');
			injectTraceContext(carrier);
		});
		const jobData = { __misskeyTraceContext: carrier };
		const telemetry = { startSpanWithTraceContext };
		for (const attempt of [0, 1]) {
			await Promise.all(['job-a', 'job-b'].map(id => runQueueJobWithTraceContext(telemetry, `Queue: ${id}`, jobData, async () => {
				Sentry.setTag('review.id', id);
				Sentry.setUser({ id });
				await delay(id === 'job-a' ? 15 : 1);
				saveContext(`${id}-${attempt}`);
				throw new Error(`${id}-${attempt}`);
			}, error => captureMessage(error.message, { level: 'error' })).catch(() => {})));
		}
		await startSpanWithTraceContext('Queue: legacy', {}, async () => {
			saveContext('legacy');
			captureMessage('legacy', { level: 'error' });
		});
	}
	await fastify.close();
	const shutdownStart = performance.now();
	await shutdownTelemetry();
	result.shutdownMs = performance.now() - shutdownStart;
	result.environment = process.env['SENTRY_TRACES_SAMPLE_RATE'];
	collector.closeAllConnections();
	await new Promise<void>(resolve => collector.close(() => resolve()));
	await new Promise<void>(resolve => process.stdout.write(`TELEMETRY_RESULT:${JSON.stringify(result)}\n`, () => resolve()));
	// boot/shutdown-handler.ts also exits after the bounded shutdown finishes.
	process.exit(0);
} catch (error) {
	console.error(error);
	process.exit(1);
}
