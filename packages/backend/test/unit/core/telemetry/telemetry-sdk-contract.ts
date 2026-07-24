/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// OTLP への再出力判定が依存する、Sentry SDK の span 形式を固定する契約テスト。
// SDK の公開 API を実際に駆動し、kind・name・属性の組み合わせを確認する。
// assumption が失敗した場合は、まず依存 SDK の挙動が変わり、Misskey 側の実装前提が崩れたと判断する。
// 期待値だけを更新せず、各 assumption のコメントに記した影響箇所を確認すること。
// Sentry 自身が収集する内容は Sentry の計装と運用者の設定に委ね、このテストでは制限しない。

import { createServer as createHttpServer, get as httpGet } from 'node:http';
import { createServer as createTcpServer } from 'node:net';
import { once } from 'node:events';
import * as dc from 'node:diagnostics_channel';
import { describe, expect, test, vi } from 'vitest';
import Fastify from 'fastify';
import { context, propagation, trace } from '@opentelemetry/api';
import * as Sentry from '@sentry/node';
import { SentryTelemetryAdapter } from '@/core/telemetry/adapters/SentryTelemetryAdapter.js';
import type { ReadableSpan, SpanProcessor } from '@opentelemetry/sdk-trace-base';

/**
 * 次の `Sentry.init()` が独自 processor を登録できるよう、テスト間で global OTel API を初期化する。
 * `Sentry.close()` だけでは global TracerProvider の登録が残るため、各テストの終了時に呼ぶ。
 */
function resetOpenTelemetryGlobals(): void {
	trace.disable();
	context.disable();
	propagation.disable();
}

/** onEnd した ReadableSpan をそのまま集める、テスト専用の SpanProcessor。 */
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

/**
 * PostgreSQL のワイヤープロトコルを最小限だけ話す loopback サーバ。
 *
 * 実際の PostgreSQL を用意せずに、pg クライアントの connect() を成功させ、その後の query() が
 * (接続がすぐ閉じられて失敗するとしても) 送信される直前まで実行されるようにする。
 * Sentry の pg 計装は query() 呼び出しの時点で span を作る (レスポンスを待たない) ため、
 * これで実際の計装コードを駆動できる。
 */
async function createFakePostgresServer(): Promise<{ port: number; close: () => Promise<void> }> {
	const server = createTcpServer(socket => {
		let gotStartup = false;
		socket.on('data', () => {
			if (!gotStartup) {
				gotStartup = true;
				const authOk = Buffer.alloc(9);
				authOk.write('R', 0, 'ascii');
				authOk.writeInt32BE(8, 1);
				authOk.writeInt32BE(0, 5);
				const ready = Buffer.alloc(6);
				ready.write('Z', 0, 'ascii');
				ready.writeInt32BE(5, 1);
				ready.write('I', 5, 'ascii');
				socket.write(Buffer.concat([authOk, ready]));
				return;
			}
			// query span の作成後は応答内容を使わないため、接続を閉じる。
			socket.end();
		});
	});
	await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
	const address = server.address();
	if (address == null || typeof address === 'string') {
		throw new Error('fake postgres server did not bind');
	}
	return {
		port: address.port,
		close: () => new Promise<void>((resolve, reject) => server.close(error => error == null ? resolve() : reject(error))),
	};
}

/** 実 OTLP protobuf を受け取る loopback collector。BatchSpanProcessor の export をそのまま生バイト列で受け取る。 */
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

/** outbound HTTP (webhook) の代役になる loopback サーバ。任意の status code を返す。 */
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

// canary で共通して使う sentinel fixture。
const QUERY_SENTINEL = 'TOKEN_SENTINEL';
const RESET_PASSWORD_SENTINEL = 'RESET_SENTINEL';
const WEBHOOK_SENTINEL = 'WEBHOOK_SENTINEL';
const SQL_LITERAL = 'SELECT * FROM users WHERE token = \'SQL_SENTINEL\'';
const ALL_SENTINELS = [QUERY_SENTINEL, RESET_PASSWORD_SENTINEL, WEBHOOK_SENTINEL, 'SQL_SENTINEL'];

// combined 構成の実 adapter を駆動し、OTLP protobuf に sentinel が含まれないことを確認する。
// OTel-only 構成は、Fastify 計装のプロセス状態を分離するため別ファイルで確認する。
describe('3-configuration canary: sentinel fixture never reaches the wire, operational fields survive', () => {
	test('combined: real SentryTelemetryAdapter.createWithOtlpExport feeds both a real OTLP protobuf and a real Sentry envelope from the same spans', async () => {
		const otlp = await createLoopbackOtlpCollector();
		const captured: unknown[] = [];
		const webhookTarget = await createLoopbackTarget(500);
		let app: ReturnType<typeof Fastify> | undefined;
		let adapter: SentryTelemetryAdapter | undefined;
		let appListening = false;

		try {
			adapter = await SentryTelemetryAdapter.createWithOtlpExport({
				enableNodeProfiling: false,
				options: {
					dsn: 'http://public@127.0.0.1/1',
					tracesSampleRate: 1,
					transport: () => ({
						send: async (envelope: unknown) => { captured.push(envelope); return { statusCode: 200 }; },
						flush: async () => true,
					}),
				},
			}, {
				serviceVersion: '0.0.0-test',
				endpoint: otlp.url,
				// Sentry の HTTP 自動計装を OTLP 側でも確認するため、`safe` を明示する。
				sentryAutoInstrumentationExport: 'safe',
			});

			// Sentry が Fastify の初期化を計装できるよう、adapter の作成後に Fastify を作る。
			app = Fastify();
			app.get('/notes/:id', async () => ({ ok: true }));
			app.get('/reset-password/:token', async () => ({ ok: true }));
			await app.listen({ port: 0, host: '127.0.0.1' });
			appListening = true;
			const address = app.server.address();
			if (address == null || typeof address === 'string') {
				throw new Error('fastify server did not bind');
			}

			// Sentry が outbound HTTP span を採取できるよう、テストの request に親 span を与える。
			await Sentry.startSpan({ name: 'canary-client' }, () => requestLoopback(`http://127.0.0.1:${address.port}/notes/1?i=${QUERY_SENTINEL}`));
			await Sentry.startSpan({ name: 'canary-client' }, () => requestLoopback(`http://127.0.0.1:${address.port}/reset-password/${RESET_PASSWORD_SENTINEL}`));
			await Sentry.startSpan({ name: 'canary-root' }, () => requestLoopback(`http://127.0.0.1:${webhookTarget.port}/services/T0/B0/${WEBHOOK_SENTINEL}`));
			// native fetch 固有の span 形式と、送信 URL の origin 化も確認する。
			await Sentry.startSpan({ name: 'canary-client' }, async () => {
				const response = await fetch(`http://127.0.0.1:${webhookTarget.port}/services/T0/B0/${WEBHOOK_SENTINEL}?i=${QUERY_SENTINEL}`);
				await response.arrayBuffer();
			});
			// SQL 本文を許可していない OTLP span を作る。
			adapter.startSpan('pg.query:SELECT', () => {
				trace.getActiveSpan()?.setAttributes({ 'db.system.name': 'postgresql', 'db.statement': SQL_LITERAL });
			});
			// captureMessage は Sentry の event として送る。
			adapter.captureMessage('API endpoint failed', { level: 'error', extra: { 'api.endpoint': 'notes/create', 'error.type': 'TypeError' } });

			await Sentry.flush(1000);
			await adapter.shutdown();
			await vi.waitFor(() => {
				expect(otlp.getBody().length).toBeGreaterThan(0);
				expect(captured.length).toBeGreaterThan(0);
			}, { timeout: 5000, interval: 20 });
			await app.close();
			appListening = false;
			await webhookTarget.close();

			const otlpWire = otlp.getBody().toString('latin1');
			const sentryWire = JSON.stringify(captured);

			expect(otlp.getBody().length).toBeGreaterThan(0);
			expect(captured.length).toBeGreaterThan(0);
			// Misskey が加工する OTLP 出力だけ、sentinel の不在を保証する。
			for (const sentinel of ALL_SENTINELS) {
				expect(otlpWire).not.toContain(sentinel);
			}
			// route template・method・status は共有 span 経由で両方の出力に残る。
			expect(otlpWire).toContain('/notes/:id');
			expect(otlpWire).toContain('http.request.method');
			expect(otlpWire).toContain('http.response.status_code');
			// 調査の起点になる受信・送信 span 名が、許可済み属性から再構築されていることを確認する。
			expect(otlpWire).toContain('GET /notes/:id');
			// Sentry の client span は `server.address` を持たないため、`url.full` から host を得る。
			expect(otlpWire).toContain(`GET 127.0.0.1:${address.port}`);
			// native fetch の送信 span 自体も OTLP に残ることを確認する。
			expect(otlpWire).toContain('auto.http.otel.node_fetch');
			expect(otlpWire).toContain(`GET 127.0.0.1:${webhookTarget.port}`);
			// Fastify の hook span も OTel-only 構成と同じく残る。名前は Sentry 側の形式のまま届く。
			expect(otlpWire).toContain('auto.http.otel.fastify');
			expect(otlpWire).toContain('@sentry/instrumentation-fastify - onRequest');
			expect(otlpWire).toContain('request_handler.fastify');
			// sentinel を含まない生属性も、キー名の不在で確認する。
			for (const forbiddenKey of ['url.path', 'url.query', 'url.scheme', 'http.request.method_original', 'user_agent.original', 'network.peer.address', 'network.peer.port']) {
				expect(otlpWire).not.toContain(forbiddenKey);
			}
			expect(sentryWire).toContain('/notes/:id');
			expect(sentryWire).toContain('http.request.method');
			expect(sentryWire).toContain('http.response.status_code');
			// captureMessage の error.type は Sentry event 側に残る。
			expect(sentryWire).toContain('error.type');
		} finally {
			if (appListening) {
				await app?.close().catch(() => undefined);
			}
			await webhookTarget.close().catch(() => undefined);
			await adapter?.shutdown().catch(() => undefined);
			await otlp.close();
			resetOpenTelemetryGlobals();
		}
	}, 10000);
});

// @fastify/otel の契約は、Sentry のプロセス状態と分離した別ファイルで確認する。
describe('telemetry SDK contract (installed dependency versions)', () => {
	test('assumption 2: the Sentry Fastify integration copies http.route onto the root http.server span, not just the request-handler span', async () => {
		// この前提が崩れると、combined 構成の受信 root span は export 判定を通らなくなる。
		const { spans, processor } = createSpanRecorder();
		Sentry.init({
			dsn: 'http://public@127.0.0.1/1',
			tracesSampleRate: 1,
			openTelemetrySpanProcessors: [processor],
			transport: () => ({ send: async () => ({ statusCode: 200 }), flush: async () => true }),
		});

		const app = Fastify();
		try {
			app.get('/notes/:id', async () => ({ ok: true }));
			await app.listen({ port: 0, host: '127.0.0.1' });
			const address = app.server.address();
			if (address == null || typeof address === 'string') {
				throw new Error('fastify server did not bind');
			}

			await requestLoopback(`http://127.0.0.1:${address.port}/notes/DO_NOT_EXPORT?i=DO_NOT_EXPORT_QUERY`);
			await vi.waitFor(() => {
				expect(spans.some(span => span.attributes['sentry.origin'] === 'auto.http.otel.http')).toBe(true);
			}, { timeout: 5000, interval: 20 });
			await Sentry.flush(1000);

			const rootHttpServerSpan = spans.find(span => span.attributes['sentry.origin'] === 'auto.http.otel.http');
			expect(rootHttpServerSpan).toBeDefined();
			expect(rootHttpServerSpan?.attributes['http.route']).toBe('/notes/:id');
			// 生の path を持つ `http.target` ではなく、route template を出力判定に使う。
			expect(String(rootHttpServerSpan?.attributes['http.target'])).toContain('DO_NOT_EXPORT_QUERY');
		} finally {
			await app.close();
			await Sentry.close(1000);
			resetOpenTelemetryGlobals();
		}
	}, 10000);

	test('assumption 2b: the Sentry Fastify integration marks hook spans with its own origin and op, and names them differently from @fastify/otel', async () => {
		// この前提が崩れると、combined 構成の hook span は export 判定を通らず、名前も伏せられる。
		// 名前は `<hook> - <handler>` ではなく `<plugin> - <hook>` と `request` なので、
		// 形式だけでは hook span と判別できず、`sentry.op` / `fastify.type` による判定が必要になる。
		const { spans, processor } = createSpanRecorder();
		Sentry.init({
			dsn: 'http://public@127.0.0.1/1',
			tracesSampleRate: 1,
			openTelemetrySpanProcessors: [processor],
			transport: () => ({ send: async () => ({ statusCode: 200 }), flush: async () => true }),
		});

		const app = Fastify();
		try {
			app.get('/notes/:id', async () => ({ ok: true }));
			await app.listen({ port: 0, host: '127.0.0.1' });
			const address = app.server.address();
			if (address == null || typeof address === 'string') {
				throw new Error('fastify server did not bind');
			}

			await requestLoopback(`http://127.0.0.1:${address.port}/notes/DO_NOT_EXPORT?i=DO_NOT_EXPORT_QUERY`);
			await vi.waitFor(() => {
				const fastifySpans = spans.filter(span => span.attributes['sentry.origin'] === 'auto.http.otel.fastify');
				expect(new Set(fastifySpans.map(span => span.attributes['sentry.op']))).toStrictEqual(new Set(['hook.fastify', 'request_handler.fastify']));
			}, { timeout: 5000, interval: 20 });
			await Sentry.flush(1000);

			const fastifySpans = spans.filter(span => span.attributes['sentry.origin'] === 'auto.http.otel.fastify');
			expect(fastifySpans.length).toBeGreaterThan(0);
			expect(new Set(fastifySpans.map(span => span.attributes['sentry.op']))).toStrictEqual(new Set(['hook.fastify', 'request_handler.fastify']));
			expect(fastifySpans.map(span => span.name).sort()).toStrictEqual(['@sentry/instrumentation-fastify - onRequest', 'request']);
			// 生 path は名前ではなく `url.path` に入るため、許可一覧側で落とせる。
			for (const span of fastifySpans) {
				expect(span.name).not.toContain('DO_NOT_EXPORT');
			}
		} finally {
			await app.close();
			await Sentry.close(1000);
			resetOpenTelemetryGlobals();
		}
	}, 10000);

	test('assumption 3: the Sentry outbound HTTP client span name retains the request path (only the query string is stripped)', async () => {
		// この前提が崩れた場合は、生 path を避けて許可済み属性から span 名を作り直す必要性を再評価する。
		const server = createHttpServer((_request, response) => response.end('ok'));
		server.listen(0, '127.0.0.1');
		await once(server, 'listening');
		const { spans, processor } = createSpanRecorder();

		Sentry.init({
			dsn: 'http://public@127.0.0.1/1',
			tracesSampleRate: 1,
			openTelemetrySpanProcessors: [processor],
			transport: () => ({ send: async () => ({ statusCode: 200 }), flush: async () => true }),
		});

		try {
			const address = server.address();
			if (address == null || typeof address === 'string') {
				throw new Error('loopback server did not bind');
			}
			await Sentry.startSpan({ name: 'root' }, () => requestLoopback(`http://127.0.0.1:${address.port}/webhook/DO_NOT_EXPORT_TOKEN?x=1`));
			await new Promise(resolve => setImmediate(resolve));
			await Sentry.flush(1000);

			const outbound = spans.find(span => span.attributes['sentry.origin'] === 'auto.http.client');
			expect(outbound).toBeDefined();
			expect(outbound?.name).toContain('/webhook/DO_NOT_EXPORT_TOKEN');
			// query string 自体は名前から落ちている (path だけが残る)。
			expect(outbound?.name).not.toContain('?x=1');
		} finally {
			await new Promise<void>((resolve, reject) => server.close(error => error == null ? resolve() : reject(error)));
			await Sentry.close(1000);
			resetOpenTelemetryGlobals();
		}
	}, 10000);

	test('assumption 6a: sentry.origin for inbound/outbound HTTP is exactly auto.http.otel.http / auto.http.client', async () => {
		// この前提が崩れると、HTTP span が origin の完全一致判定から外れて export されなくなる。
		const server = createHttpServer((_request, response) => response.end('ok'));
		server.listen(0, '127.0.0.1');
		await once(server, 'listening');
		const { spans, processor } = createSpanRecorder();
		Sentry.init({
			dsn: 'http://public@127.0.0.1/1',
			tracesSampleRate: 1,
			openTelemetrySpanProcessors: [processor],
			transport: () => ({ send: async () => ({ statusCode: 200 }), flush: async () => true }),
		});
		try {
			const address = server.address();
			if (address == null || typeof address === 'string') {
				throw new Error('loopback server did not bind');
			}
			await Sentry.startSpan({ name: 'root' }, () => requestLoopback(`http://127.0.0.1:${address.port}/`));
			await new Promise(resolve => setImmediate(resolve));
			await Sentry.flush(1000);

			expect(spans.some(span => span.attributes['sentry.origin'] === 'auto.http.otel.http')).toBe(true);
			expect(spans.some(span => span.attributes['sentry.origin'] === 'auto.http.client')).toBe(true);
		} finally {
			await new Promise<void>((resolve, reject) => server.close(error => error == null ? resolve() : reject(error)));
			await Sentry.close(1000);
			resetOpenTelemetryGlobals();
		}
	}, 10000);

	test('assumption 6b: sentry.origin for a PostgreSQL query span is exactly auto.db.otel.postgres, and pg.connect carries no origin at all', async () => {
		// この前提が崩れると、PostgreSQL の query と connect を分ける capture* 設定が正しく働かなくなる。
		const fakePg = await createFakePostgresServer();
		const { spans, processor } = createSpanRecorder();
		Sentry.init({
			dsn: 'http://public@127.0.0.1/1',
			tracesSampleRate: 1,
			openTelemetrySpanProcessors: [processor],
			transport: () => ({ send: async () => ({ statusCode: 200 }), flush: async () => true }),
		});
		try {
			const pg = await import('pg');
			const client = new pg.Client({ host: '127.0.0.1', port: fakePg.port, database: 'db', user: 'u', password: 'p' });
			// fake server は startup 応答後に接続を閉じるだけなので、query の失敗は想定内。
			client.on('error', () => undefined);

			await Sentry.startSpan({ name: 'root' }, async () => {
				await client.connect();
				await client.query('SELECT * FROM users WHERE token = \'DO_NOT_EXPORT_SQL\'').catch(() => undefined);
			});
			await vi.waitFor(() => {
				expect(spans.some(span => span.name === 'pg.connect')).toBe(true);
				expect(spans.some(span => typeof span.name === 'string' && span.name.startsWith('pg.query'))).toBe(true);
			}, { timeout: 5000, interval: 20 });
			await Sentry.flush(1000);

			const connectSpan = spans.find(span => span.name === 'pg.connect');
			const querySpan = spans.find(span => typeof span.name === 'string' && span.name.startsWith('pg.query'));
			expect(connectSpan).toBeDefined();
			expect(connectSpan?.attributes['sentry.origin']).toBeUndefined();
			expect(querySpan).toBeDefined();
			expect(querySpan?.attributes['sentry.origin']).toBe('auto.db.otel.postgres');
		} finally {
			await fakePg.close();
			await Sentry.close(1000);
			resetOpenTelemetryGlobals();
		}
	}, 10000);

	test('assumption 6c: sentry.origin for a Redis command span (via the ioredis diagnostics_channel contract) is exactly auto.db.redis.diagnostic_channel', async () => {
		// この前提が崩れると、Redis span が origin の完全一致判定から外れて export されなくなる。
		// Redis サーバの代わりに ioredis の diagnostics channel 形式を直接発行する。
		const { spans, processor } = createSpanRecorder();
		Sentry.init({
			dsn: 'http://public@127.0.0.1/1',
			tracesSampleRate: 1,
			openTelemetrySpanProcessors: [processor],
			transport: () => ({ send: async () => ({ statusCode: 200 }), flush: async () => true }),
		});
		try {
			await Sentry.startSpan({ name: 'root' }, async () => {
				const channel = dc.tracingChannel('ioredis:command');
				await channel.tracePromise(async () => 'OK', {
					command: 'get',
					args: ['DO_NOT_EXPORT_KEY'],
					serverAddress: '127.0.0.1',
					serverPort: 6379,
				});
			});
			await new Promise(resolve => setImmediate(resolve));
			await Sentry.flush(1000);

			const redisSpan = spans.find(span => span.attributes['db.system.name'] === 'redis');
			expect(redisSpan).toBeDefined();
			expect(redisSpan?.attributes['sentry.origin']).toBe('auto.db.redis.diagnostic_channel');
		} finally {
			await Sentry.close(1000);
			resetOpenTelemetryGlobals();
		}
	}, 10000);

	test('assumption 7: maxBreadcrumbs: 0 keeps console output from being attached to captured events', async () => {
		// この前提が崩れると、console の引数が Sentry event に添付されるため、無効化方法を見直す必要がある。
		const captured: unknown[] = [];
		const CONSOLE_SENTINEL = 'CONSOLE_BREADCRUMB_SENTINEL_DO_NOT_EXPORT';

		const adapter = await SentryTelemetryAdapter.create({
			enableNodeProfiling: false,
			options: {
				dsn: 'http://public@127.0.0.1/1',
				tracesSampleRate: 1,
				transport: () => ({
					send: async (envelope: unknown) => { captured.push(envelope); return { statusCode: 200 }; },
					flush: async () => true,
				}),
			},
		});

		try {
			// console integration を駆動するため、実際の console.log を呼ぶ。
			console.log(CONSOLE_SENTINEL);

			adapter.captureMessage('telemetry-sdk-contract maxBreadcrumbs canary', { level: 'error' });
			await Sentry.flush(1000);

			expect(captured.length).toBeGreaterThan(0);
			expect(JSON.stringify(captured)).not.toContain(CONSOLE_SENTINEL);
		} finally {
			await adapter.shutdown();
			resetOpenTelemetryGlobals();
		}
	}, 10000);
});
