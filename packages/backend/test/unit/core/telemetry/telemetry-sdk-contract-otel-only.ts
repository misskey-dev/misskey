/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// OTel-only 構成の Fastify 計装契約を確認する。
// Sentry の Fastify 計装は diagnostics channel の購読をプロセス内に保持し、
// 素の `@fastify/otel` と同じプロセスで実行すると、重複した decorator により `FST_ERR_DEC_ALREADY_PRESENT` で起動に失敗しうる。
// 実行順が逆の場合も Sentry 側の route 属性と干渉する。
// 本番では両構成を同時登録しないため、テストもファイルを分けてプロセス状態を隔離する。
// この分離を崩して Sentry 側の契約テストと一つのファイルにまとめないこと。
// assumption が失敗した場合は、依存 SDK の挙動変更によって Misskey 側の実装前提が崩れていないか確認すること。

import { createServer as createHttpServer, get as httpGet } from 'node:http';
import { describe, expect, test } from 'vitest';
import Fastify from 'fastify';
import { FastifyOtelInstrumentation } from '@fastify/otel';
import { context, propagation, trace } from '@opentelemetry/api';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { OpenTelemetryAdapter } from '@/core/telemetry/adapters/OpenTelemetryAdapter.js';
import { registerHttpServerInstrumentation } from '@/server/http-server-instrumentation.js';
import type { ReadableSpan, SpanProcessor } from '@opentelemetry/sdk-trace-base';
import type { FastifyReply, FastifyRequest, HookHandlerDoneFunction } from 'fastify';

function resetOpenTelemetryGlobals(): void {
	trace.disable();
	context.disable();
	propagation.disable();
}

function createSpanRecorder(): { spans: ReadableSpan[]; processor: SpanProcessor } {
	const spans: ReadableSpan[] = [];
	return {
		spans,
		processor: {
			onStart: () => undefined,
			onEnd: span => spans.push(span),
			forceFlush: async () => undefined,
			shutdown: async () => undefined,
		},
	};
}

function requestLoopback(url: string): Promise<void> {
	return new Promise((resolve, reject) => {
		const request = httpGet(url, (response) => {
			response.resume();
			response.once('end', resolve);
		});
		request.once('error', reject);
	});
}

async function createLoopbackOtlpCollector(): Promise<{ url: string; getBody: () => Buffer; close: () => Promise<void> }> {
	const chunks: Buffer[] = [];
	const server = createHttpServer((request, response) => {
		const buf: Buffer[] = [];
		request.on('data', (chunk: Buffer) => buf.push(Buffer.from(chunk)));
		request.on('end', () => {
			chunks.push(Buffer.concat(buf));
			response.writeHead(200).end();
		});
	});
	await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
	const address = server.address();
	if (address == null || typeof address === 'string') {
		throw new Error('loopback OTLP collector did not bind');
	}
	return {
		url: `http://127.0.0.1:${address.port}/v1/traces`,
		getBody: () => Buffer.concat(chunks),
		close: () => new Promise<void>((resolve, reject) => server.close(error => error == null ? resolve() : reject(error))),
	};
}

async function createLoopbackTarget(statusCode: number): Promise<{ port: number; close: () => Promise<void> }> {
	const server = createHttpServer((_request, response) => {
		response.writeHead(statusCode);
		response.end('ok');
	});
	await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
	const address = server.address();
	if (address == null || typeof address === 'string') {
		throw new Error('loopback target server did not bind');
	}
	return {
		port: address.port,
		close: () => new Promise<void>((resolve, reject) => server.close(error => error == null ? resolve() : reject(error))),
	};
}

// hook span 名は hook 名と関数名から作られるため、名前を固定できる関数宣言で渡す。
function checkAuth(_request: FastifyRequest, _reply: FastifyReply, done: HookHandlerDoneFunction): void {
	done();
}

function routeGuard(_request: FastifyRequest, _reply: FastifyReply, done: HookHandlerDoneFunction): void {
	done();
}

const QUERY_SENTINEL = 'TOKEN_SENTINEL';
const RESET_PASSWORD_SENTINEL = 'RESET_SENTINEL';
const WEBHOOK_SENTINEL = 'WEBHOOK_SENTINEL';
const SQL_LITERAL = 'SELECT * FROM users WHERE token = \'SQL_SENTINEL\'';
const ALL_SENTINELS = [QUERY_SENTINEL, RESET_PASSWORD_SENTINEL, WEBHOOK_SENTINEL, 'SQL_SENTINEL'];

describe('telemetry SDK contract (OTel-only, installed dependency versions)', () => {
	test('assumption 1: @fastify/otel puts the route template on http.route and the raw request.url (with query) on url.path', async () => {
		// `http.route` を許可し、生の `url.path` を除外する前提を実計装で確認する。
		// 生 path が `http.route` に入るようになった場合は、既知の route template との照合など値レベルの検証を追加する必要がある。
		const { spans, processor } = createSpanRecorder();
		const provider = new NodeTracerProvider({ spanProcessors: [processor] });
		const instrumentation = new FastifyOtelInstrumentation({ instrumentHooks: false });
		instrumentation.setTracerProvider(provider);
		instrumentation.enable();

		const app = Fastify();
		try {
			await app.register(instrumentation.plugin());
			app.get('/notes/:id', async () => ({ ok: true }));
			await app.listen({ port: 0, host: '127.0.0.1' });
			const address = app.server.address();
			if (address == null || typeof address === 'string') {
				throw new Error('fastify server did not bind');
			}

			await requestLoopback(`http://127.0.0.1:${address.port}/notes/DO_NOT_EXPORT?i=DO_NOT_EXPORT_QUERY`);
			await new Promise(resolve => setImmediate(resolve));

			const requestSpan = spans.find(span => span.name === 'request');
			expect(requestSpan).toBeDefined();
			expect(requestSpan?.attributes['http.route']).toBe('/notes/:id');
			expect(requestSpan?.attributes['url.path']).toBe('/notes/DO_NOT_EXPORT?i=DO_NOT_EXPORT_QUERY');
		} finally {
			await app.close();
			instrumentation.disable();
		}
	}, 10000);

	test('assumption 2: @fastify/otel names hook spans "<hook> - <handler>" from source identifiers only, and never puts the route or path in the name', async () => {
		// `safeName` は hook span 名をこの形式で照合してそのまま通す。
		// 名前に route や生 path が入るようになった場合は、許可をやめるか属性から組み立て直す必要がある。
		const { spans, processor } = createSpanRecorder();
		const provider = new NodeTracerProvider({ spanProcessors: [processor] });
		const instrumentation = new FastifyOtelInstrumentation();
		instrumentation.setTracerProvider(provider);
		instrumentation.enable();

		const app = Fastify();
		try {
			await app.register(instrumentation.plugin());
			// hook の instrumentation は plugin 登録後に追加した hook だけを対象にする。
			app.addHook('onRequest', checkAuth);
			app.get('/notes/:id', { onRequest: routeGuard }, async () => ({ ok: true }));
			await app.listen({ port: 0, host: '127.0.0.1' });
			const address = app.server.address();
			if (address == null || typeof address === 'string') {
				throw new Error('fastify server did not bind');
			}

			await requestLoopback(`http://127.0.0.1:${address.port}/notes/DO_NOT_EXPORT?i=DO_NOT_EXPORT_QUERY`);
			await new Promise(resolve => setImmediate(resolve));

			const hookSpans = spans.filter(span => span.attributes['fastify.type'] != null);
			expect(hookSpans.map(span => span.name).sort()).toStrictEqual([
				'handler - fastify -> @fastify/otel',
				'onRequest - checkAuth',
				'onRequest - routeGuard',
			]);
			// route と生 path は名前に現れない。
			for (const span of hookSpans) {
				expect(span.name).not.toContain('DO_NOT_EXPORT');
				expect(span.name).not.toContain('/notes');
			}
			// `fastify.type` は固定語彙で、sanitizer 側の許可判定と一致する。
			expect(new Set(hookSpans.map(span => span.attributes['fastify.type']))).toStrictEqual(new Set(['hook', 'route-hook', 'request-handler']));
			// route handler の span は method を持たないため、名前は hook 形式でしか復元できない。
			const handlerSpan = hookSpans.find(span => span.attributes['fastify.type'] === 'request-handler');
			expect(handlerSpan?.attributes['http.request.method']).toBeUndefined();
			expect(handlerSpan?.attributes['hook.callback.name']).toBe('anonymous');
		} finally {
			await app.close();
			instrumentation.disable();
		}
	}, 10000);
});

describe('3-configuration canary (OTel-only part): sentinel fixture never reaches the wire, operational fields survive', () => {
	test('OTel-only: real OpenTelemetryAdapter + real OTLP protobuf', async () => {
		const otlp = await createLoopbackOtlpCollector();
		const webhookTarget = await createLoopbackTarget(500);
		const app = Fastify();
		let adapter: OpenTelemetryAdapter | undefined;
		let appListening = false;

		try {
			const otelConfig = {
				serviceVersion: '0.0.0-test',
				endpoint: otlp.url,
				capturePgSpans: false,
				capturePgStatement: false,
				capturePgConnectionSpans: false,
				captureRedisCommandSpans: false,
				captureRedisConnectionSpans: false,
				captureRedisRootSpans: false,
			};
			adapter = await OpenTelemetryAdapter.create(otelConfig);

			// ServerService が実際に呼ぶのと同じ経路で inbound 計装を登録する。
			await registerHttpServerInstrumentation(app, { otelForBackend: otelConfig, sentryForBackend: undefined });
			app.get('/notes/:id', { onRequest: routeGuard }, async () => ({ ok: true }));
			app.get('/reset-password/:token', async () => ({ ok: true }));
			await app.listen({ port: 0, host: '127.0.0.1' });
			appListening = true;
			const address = app.server.address();
			if (address == null || typeof address === 'string') {
				throw new Error('fastify server did not bind');
			}

			// 受信側には query と credential を含む path を与える。
			await requestLoopback(`http://127.0.0.1:${address.port}/notes/1?i=${QUERY_SENTINEL}`);
			await requestLoopback(`http://127.0.0.1:${address.port}/reset-password/${RESET_PASSWORD_SENTINEL}`);
			// 送信側には秘密を含む path を与え、500 応答の error.type も確認する。
			await requestLoopback(`http://127.0.0.1:${webhookTarget.port}/services/T0/B0/${WEBHOOK_SENTINEL}`);
			// SQL 本文は processor が受け取る属性として直接付与する。
			adapter.startSpan('pg.query:SELECT', () => {
				trace.getActiveSpan()?.setAttributes({ 'db.system.name': 'postgresql', 'db.statement': SQL_LITERAL });
			});

			await adapter.shutdown();
			await app.close();
			appListening = false;
			await webhookTarget.close();

			const wire = otlp.getBody().toString('latin1');
			expect(otlp.getBody().length).toBeGreaterThan(0);
			for (const sentinel of ALL_SENTINELS) {
				expect(wire).not.toContain(sentinel);
			}
			expect(wire).toContain('/notes/:id');
			expect(wire).toContain('/reset-password/:token');
			expect(wire).toContain('http.request.method');
			expect(wire).toContain('http.response.status_code');
			// 値の偶然一致を避けるため、500 応答は `error.type` の属性名で確認する。
			expect(wire).toContain('error.type');
			// hook span は名前を伏せずに届く。属性だけを見ていると、名前が全件 `[redacted]` でも気付けない。
			expect(wire).toContain('onRequest - routeGuard');
			expect(wire).toContain('handler - fastify -> @fastify/otel');
			expect(wire).toContain('request-handler');
		} finally {
			if (appListening) {
				await app.close().catch(() => undefined);
			}
			await adapter?.shutdown().catch(() => undefined);
			await webhookTarget.close().catch(() => undefined);
			await otlp.close();
			resetOpenTelemetryGlobals();
		}
	}, 10000);

	test('OTel-only, unmatched route (404): @fastify/otel never writes the raw path onto http.route, and the sentinel never reaches the OTLP wire', async () => {
		// `sanitizeRoute` は値の出所を `@fastify/otel` の route template に依存している。
		// 未一致リクエストへ生 path が設定されないことを確認し、credential の出力を防ぐ。
		const otlp = await createLoopbackOtlpCollector();
		const app = Fastify();
		let adapter: OpenTelemetryAdapter | undefined;
		let appListening = false;
		const sentinel = 'SENTINEL_DO_NOT_EXPORT';

		try {
			const otelConfig = {
				serviceVersion: '0.0.0-test',
				endpoint: otlp.url,
				capturePgSpans: false,
				capturePgStatement: false,
				capturePgConnectionSpans: false,
				captureRedisCommandSpans: false,
				captureRedisConnectionSpans: false,
				captureRedisRootSpans: false,
			};
			adapter = await OpenTelemetryAdapter.create(otelConfig);
			await registerHttpServerInstrumentation(app, { otelForBackend: otelConfig, sentryForBackend: undefined });
			app.get('/notes/:id', async () => ({ ok: true }));
			await app.listen({ port: 0, host: '127.0.0.1' });
			appListening = true;
			const address = app.server.address();
			if (address == null || typeof address === 'string') {
				throw new Error('fastify server did not bind');
			}

			// 未一致の path と query の両方に sentinel を入れる。
			await requestLoopback(`http://127.0.0.1:${address.port}/no-such-route/${sentinel}?token=${sentinel}`);

			await adapter.shutdown();
			await app.close();
			appListening = false;

			const wire = otlp.getBody().toString('latin1');
			expect(otlp.getBody().length).toBeGreaterThan(0);
			expect(wire).not.toContain(sentinel);
			// 未一致リクエストには `http.route` 属性自体がないことを確認する。
			expect(wire).not.toContain('http.route');
			expect(wire).toContain('http.response.status_code');
		} finally {
			if (appListening) {
				await app.close().catch(() => undefined);
			}
			await adapter?.shutdown().catch(() => undefined);
			await otlp.close();
			resetOpenTelemetryGlobals();
		}
	}, 10000);
});
