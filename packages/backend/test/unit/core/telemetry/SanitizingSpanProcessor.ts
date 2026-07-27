/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { once } from 'node:events';
import { createServer, get } from 'node:http';
import { describe, expect, test, vi } from 'vitest';
import { context, propagation, SpanKind, trace } from '@opentelemetry/api';
import * as Sentry from '@sentry/node';
import { createSanitizedReadableSpan, isAllowedCombinedScope, SanitizingSpanProcessor } from '@/core/telemetry/SanitizingSpanProcessor.js';
import { exceptionMessageMaxBytes, exceptionStacktraceMaxBytes } from '@/core/telemetry/sanitizer/text.js';
import type { ReadableSpan, SpanProcessor } from '@opentelemetry/sdk-trace-base';

const sentryScope = { name: '@sentry/node' };
// Sentry の PostgreSQL・Redis 計装が設定する origin を fixture に使う。
const sentryOrigins = {
	pg: 'auto.db.otel.postgres',
	redis: 'auto.db.redis.diagnostic_channel',
	httpServer: 'auto.http.otel.http',
	httpClient: 'auto.http.client',
} as const;
const noCapture = {
	capturePgSpans: false,
	capturePgConnectionSpans: false,
	captureRedisCommandSpans: false,
	captureRedisConnectionSpans: false,
	captureRedisRootSpans: false,
};

function requestLoopback(url: string): Promise<void> {
	return new Promise((resolve, reject) => {
		const request = get(url, (response) => {
			response.resume();
			response.once('end', resolve);
		});
		request.once('error', reject);
	});
}

describe('SanitizingSpanProcessor', () => {
	test('exports only a sanitized detached copy', () => {
		const downstream = { onStart: vi.fn(), onEnd: vi.fn(), forceFlush: vi.fn(), shutdown: vi.fn() };
		const processor = new SanitizingSpanProcessor(downstream as any);
		const span = {
			name: 'POST https://host.test/webhook/DO_NOT_EXPORT',
			attributes: { 'url.full': 'https://host.test/webhook/DO_NOT_EXPORT?token=DO_NOT_EXPORT' },
			// query 形式の記号を含む、不正な計測元名として落とす。
			events: [], links: [], status: { code: 0 }, resource: { attributes: {} }, instrumentationScope: { name: 'DO_NOT_EXPORT?scope' }, kind: 1, startTime: [0, 0], endTime: [0, 1],
			parentSpanContext: { traceId: '0123456789abcdef0123456789abcdef', spanId: 'fedcba9876543210', traceFlags: 1, isRemote: true, traceState: { private: 'DO_NOT_EXPORT' } },
			spanContext: () => ({ traceId: '0123456789abcdef0123456789abcdef', spanId: '0123456789abcdef', traceFlags: 1, isRemote: false, traceState: { canary: 'DO_NOT_EXPORT' } }),
		};
		processor.onEnd(span as any);
		const exported = downstream.onEnd.mock.calls[0][0];
		expect(exported).not.toBe(span);
		expect(exported.parentSpanContext).toEqual({
			traceId: '0123456789abcdef0123456789abcdef',
			spanId: 'fedcba9876543210',
			traceFlags: 1,
			isRemote: true,
		});
		expect(exported.parentSpanContext).not.toHaveProperty('traceState');
		expect(JSON.stringify(exported)).not.toContain('DO_NOT_EXPORT');
	});

	test('keeps exception type/message/stacktrace on exception events, drops non-exception events entirely, and links keep only their trace identity', () => {
		const base = { attributes: {}, status: { code: 0 }, resource: { attributes: {} }, instrumentationScope: { name: 'misskey-backend' }, kind: 1, startTime: [1, 0], endTime: [1, 1], name: 'API: notes/show', spanContext: () => ({ traceId: '0123456789abcdef0123456789abcdef', spanId: '0123456789abcdef', traceFlags: 1, isRemote: false }) };
		const span = {
			...base,
			events: [
				// 例外情報は残し、表示を偽装できる改行は除去する。
				{ name: 'exception', time: [1, 0], attributes: { 'exception.type': 'TypeError', 'exception.message': 'boom at foo.ts:1', 'exception.stacktrace': 'TypeError: boom\n    at foo (foo.ts:1:1)' } },
				// exception 以外の event は、利用者情報を含みうるため破棄する。
				{ name: 'log', time: [1, 0], attributes: { message: 'DO_NOT_EXPORT' } },
			],
			// link は jobTraceContextMode: 'link' の下で別 trace を指すのが正常なので、自 span とは異なる trace/span id を使う。
			links: [
				{ context: { traceId: 'fedcba9876543210fedcba9876543210', spanId: 'fedcba9876543210', traceFlags: 1, isRemote: true }, attributes: { private: 'DO_NOT_EXPORT' }, traceState: { private: 'DO_NOT_EXPORT' } },
			],
		};
		const exported = createSanitizedReadableSpan(span as any);
		expect(exported?.events).toEqual([{ name: 'exception', time: [1, 0], droppedAttributesCount: 0, attributes: { 'exception.type': 'TypeError', 'exception.message': 'boom at foo.ts:1', 'exception.stacktrace': 'TypeError: boom    at foo (foo.ts:1:1)' } }]);
		expect(exported?.links).toEqual([{ context: { traceId: 'fedcba9876543210fedcba9876543210', spanId: 'fedcba9876543210', traceFlags: 1, isRemote: true } }]);
		expect(JSON.stringify(exported)).not.toContain('DO_NOT_EXPORT');
	});

	test('strips NUL/CR/LF/ESC control characters from exception.message (log injection / terminal escape abuse, same threat model as truncateDbStatement)', () => {
		const base = { attributes: {}, status: { code: 0 }, resource: { attributes: {} }, instrumentationScope: { name: 'misskey-backend' }, kind: 1, startTime: [1, 0], endTime: [1, 1], name: 'API: notes/show', spanContext: () => ({ traceId: '0123456789abcdef0123456789abcdef', spanId: '0123456789abcdef', traceFlags: 1, isRemote: false }) };
		const span = {
			...base,
			events: [
				{ name: 'exception', time: [1, 0], attributes: { 'exception.type': 'TypeError', 'exception.message': 'control chars\r\n\x00\x1b[31m' } },
			],
		};
		const exported = createSanitizedReadableSpan(span as any);
		const message = (exported?.events?.[0] as unknown as { attributes: { 'exception.message': string } }).attributes['exception.message'];
		expect(message).not.toMatch(/[\x00\r\n\x1b]/);
		expect(message).toBe('control chars[31m');
	});

	test('strips NUL/CR/LF/ESC control characters from exception.stacktrace too (same threat model as exception.message/truncateDbStatement)', () => {
		const base = { attributes: {}, status: { code: 0 }, resource: { attributes: {} }, instrumentationScope: { name: 'misskey-backend' }, kind: 1, startTime: [1, 0], endTime: [1, 1], name: 'API: notes/show', spanContext: () => ({ traceId: '0123456789abcdef0123456789abcdef', spanId: '0123456789abcdef', traceFlags: 1, isRemote: false }) };
		const span = {
			...base,
			events: [
				{ name: 'exception', time: [1, 0], attributes: { 'exception.type': 'TypeError', 'exception.stacktrace': 'control chars\r\n\x00\x1b[31m' } },
			],
		};
		const exported = createSanitizedReadableSpan(span as any);
		const stacktrace = (exported?.events?.[0] as unknown as { attributes: { 'exception.stacktrace': string } }).attributes['exception.stacktrace'];
		expect(stacktrace).not.toMatch(/[\x00\r\n\x1b]/);
		expect(stacktrace).toBe('control chars[31m');
	});

	test('truncates an oversized exception.stacktrace instead of dropping the whole span (regression test: boot/entry.ts sets Error.stackTraceLimit = Infinity, so a deep call stack can exceed the 64KiB whole-span budget on its own)', () => {
		// 大きなスタックトレースを個別上限で切り、span の名前と status を残す。
		// 制御文字除去とは分けて確認するため、フレームは空白で区切る。
		const hugeStacktrace = 'TypeError: boom ' + '    at frame (file.ts:1:1) '.repeat(4000); // 約108KB
		expect(Buffer.byteLength(hugeStacktrace, 'utf-8')).toBeGreaterThan(64 * 1024);

		const base = { attributes: {}, status: { code: 2 }, resource: { attributes: {} }, instrumentationScope: { name: 'misskey-backend' }, kind: 1, startTime: [1, 0], endTime: [1, 1], name: 'API: notes/show', spanContext: () => ({ traceId: '0123456789abcdef0123456789abcdef', spanId: '0123456789abcdef', traceFlags: 1, isRemote: false }) };
		const span = {
			...base,
			events: [
				{ name: 'exception', time: [1, 0], attributes: { 'exception.type': 'TypeError', 'exception.message': 'boom', 'exception.stacktrace': hugeStacktrace } },
			],
		};

		const exported = createSanitizedReadableSpan(span as any);

		expect(exported).not.toBeUndefined();
		expect(exported?.status).toEqual({ code: 2 });
		const stacktrace = (exported?.events?.[0] as unknown as { attributes: { 'exception.stacktrace': string } }).attributes['exception.stacktrace'];
		expect(Buffer.byteLength(stacktrace, 'utf-8')).toBeLessThanOrEqual(exceptionStacktraceMaxBytes);
		expect(hugeStacktrace.startsWith(stacktrace)).toBe(true);
	});

	test('truncates an oversized exception.message too, and never drops the span itself when maxEvents maximal exceptions exceed the budget after JSON escaping', () => {
		// JSON 化で膨張する例外を複数与え、全体上限まで event を減らして span を残すことを確認する。
		const hugeMessage = '"'.repeat(40000);
		const hugeStacktrace = '\\'.repeat(40000);
		const base = { attributes: {}, status: { code: 2 }, resource: { attributes: {} }, instrumentationScope: { name: 'misskey-backend' }, kind: 1, startTime: [1, 0], endTime: [1, 1], name: 'API: notes/show', spanContext: () => ({ traceId: '0123456789abcdef0123456789abcdef', spanId: '0123456789abcdef', traceFlags: 1, isRemote: false }) };
		const span = {
			...base,
			// event 数の上限を超える入力を与える。
			events: Array.from({ length: 6 }, () => ({ name: 'exception', time: [1, 0], attributes: { 'exception.type': 'TypeError', 'exception.message': hugeMessage, 'exception.stacktrace': hugeStacktrace } })),
		};

		const exported = createSanitizedReadableSpan(span as any);

		// 例外が大きくても、調査の起点となる span 自体は残す。
		expect(exported).not.toBeUndefined();
		expect(exported?.status).toEqual({ code: 2 });
		expect(exported?.name).toBe('API: notes/show');
		// 個別上限と JSON 化後の全体上限をどちらも満たす。
		expect(exported?.events?.length).toBeGreaterThan(0);
		expect(exported?.events?.length).toBeLessThanOrEqual(4);
		for (const event of exported?.events ?? []) {
			const attributes = (event as unknown as { attributes: { 'exception.message': string; 'exception.stacktrace': string } }).attributes;
			expect(Buffer.byteLength(attributes['exception.message'], 'utf-8')).toBeLessThanOrEqual(exceptionMessageMaxBytes);
			expect(Buffer.byteLength(attributes['exception.stacktrace'], 'utf-8')).toBeLessThanOrEqual(exceptionStacktraceMaxBytes);
		}
		expect(Buffer.byteLength(JSON.stringify(exported?.events), 'utf-8')).toBeLessThanOrEqual(64 * 1024);
	});

	test('reports droppedEventsCount as the SDK\'s own count plus what the sanitizer removed', () => {
		const base = { attributes: {}, links: [], status: { code: 2 }, resource: { attributes: {} }, instrumentationScope: { name: 'misskey-backend' }, kind: 1, startTime: [1, 0], endTime: [1, 1], name: 'API: notes/show', spanContext: () => ({ traceId: '0123456789abcdef0123456789abcdef', spanId: '0123456789abcdef', traceFlags: 1, isRemote: false }) };
		const exceptionEvent = { name: 'exception', time: [1, 0], attributes: { 'exception.type': 'TypeError', 'exception.message': 'boom' } };

		// SDK と sanitizer の両方が破棄した event を合算する。
		expect(createSanitizedReadableSpan({ ...base, events: [exceptionEvent], droppedEventsCount: 3 } as any)?.droppedEventsCount).toBe(3);
		// exception 以外の event も破棄数に含める。
		expect(createSanitizedReadableSpan({ ...base, events: [exceptionEvent, { name: 'log', time: [1, 0], attributes: {} }], droppedEventsCount: 0 } as any)?.droppedEventsCount).toBe(1);
		// event 数の上限による打ち切りも含める。
		expect(createSanitizedReadableSpan({ ...base, events: Array.from({ length: 6 }, () => exceptionEvent), droppedEventsCount: 2 } as any)?.droppedEventsCount).toBe(4);
		// events が配列でなくても、安全な空配列として span を処理する。
		const malformed = createSanitizedReadableSpan({ ...base, events: 'not-an-array' } as any);
		expect(malformed).not.toBeUndefined();
		expect(malformed?.events).toEqual([]);
		expect(malformed?.droppedEventsCount).toBe(0);
	});

	test('strips C1 control characters and the rest of C0 from exception.message (U+009B is an 8-bit CSI: enumerating only NUL/CR/LF/ESC leaves an equivalent terminal escape open)', () => {
		const base = { attributes: {}, status: { code: 2 }, resource: { attributes: {} }, instrumentationScope: { name: 'misskey-backend' }, kind: 1, startTime: [1, 0], endTime: [1, 1], name: 'API: notes/show', spanContext: () => ({ traceId: '0123456789abcdef0123456789abcdef', spanId: '0123456789abcdef', traceFlags: 1, isRemote: false }) };
		const span = {
			...base,
			events: [
				// \u009b は 8-bit CSI、\b は backspace、\x7f は DEL として除去対象にする。
				{ name: 'exception', time: [1, 0], attributes: { 'exception.type': 'TypeError', 'exception.message': 'a\u009b31mFAKE\b\x7fb\tc' } },
			],
		};

		const exported = createSanitizedReadableSpan(span as any);

		const message = (exported?.events?.[0] as unknown as { attributes: { 'exception.message': string } }).attributes['exception.message'];
		// タブは改行偽装にもターミナル制御にも使えず、SQLの整形に現れるため残す。
		expect(message).toBe('a31mFAKEb\tc');
	});

	test('drops non-exception events and links with a malformed trace or span id', () => {
		const base = { attributes: {}, status: { code: 0 }, resource: { attributes: {} }, instrumentationScope: { name: 'misskey-backend' }, kind: 1, startTime: [1, 0], endTime: [1, 1], name: 'API: notes/show', spanContext: () => ({ traceId: '0123456789abcdef0123456789abcdef', spanId: '0123456789abcdef', traceFlags: 1, isRemote: false }) };
		const span = {
			...base,
			events: [{ name: 'log', time: [1, 0], attributes: { message: 'DO_NOT_EXPORT' } }],
			links: [
				{ context: { traceId: 'not-a-trace-id', spanId: '2'.repeat(16) } },
				{ context: { traceId: '1'.repeat(32), spanId: 'not-a-span-id' } },
				{ context: { traceId: '1'.repeat(32), spanId: '2'.repeat(16) } },
			],
		};
		const exported = createSanitizedReadableSpan(span as any);
		expect(exported?.events).toEqual([]);
		// traceFlags/isRemote が未設定の場合は安全側 (0/false) を補って作り直す。
		expect(exported?.links).toEqual([{ context: { traceId: '1'.repeat(32), spanId: '2'.repeat(16), traceFlags: 0, isRemote: false } }]);
	});

	test('truncates events and links to their configured maximum', () => {
		const base = { attributes: {}, status: { code: 0 }, resource: { attributes: {} }, instrumentationScope: { name: 'misskey-backend' }, kind: 1, startTime: [1, 0], endTime: [1, 1], name: 'API: notes/show', spanContext: () => ({ traceId: '0123456789abcdef0123456789abcdef', spanId: '0123456789abcdef', traceFlags: 1, isRemote: false }) };
		const span = {
			...base,
			events: Array.from({ length: 6 }, () => ({ name: 'exception', time: [1, 0], attributes: { 'exception.type': 'TypeError' } })),
			links: Array.from({ length: 10 }, () => ({ context: { traceId: '1'.repeat(32), spanId: '2'.repeat(16), traceFlags: 1, isRemote: false } })),
		};
		const exported = createSanitizedReadableSpan(span as any);
		expect(exported?.events).toHaveLength(4);
		expect(exported?.links).toHaveLength(8);
	});

	test('accepts actual Sentry NodeClient HTTP inbound and outbound tuples', async () => {
		const spans: ReadableSpan[] = [];
		const recorder: SpanProcessor = {
			onStart: () => undefined,
			onEnd: span => spans.push(span),
			forceFlush: async () => undefined,
			shutdown: async () => undefined,
		};
		Sentry.init({
			dsn: 'http://public@127.0.0.1/1',
			tracesSampleRate: 1,
			openTelemetrySpanProcessors: [recorder],
			transport: () => ({
				send: async () => ({ statusCode: 200 }),
				flush: async () => true,
			}),
		});
		const server = createServer((_request, response) => response.end('ok'));
		server.listen(0, '127.0.0.1');
		await once(server, 'listening');

		try {
			const address = server.address();
			if (address == null || typeof address === 'string') {
				throw new Error('loopback server did not bind');
			}
			await Sentry.startSpan({ name: 'SDK HTTP tuple probe' }, () => requestLoopback(`http://127.0.0.1:${address.port}/`));
			await new Promise<void>(resolve => setImmediate(resolve));
			await Sentry.flush(1000);

			const inbound = spans.find(span => span.attributes['sentry.origin'] === sentryOrigins.httpServer);
			const outbound = spans.find(span => span.attributes['sentry.origin'] === sentryOrigins.httpClient);
			expect(inbound).toBeDefined();
			expect(outbound).toBeDefined();
			expect(inbound?.instrumentationScope.name).toBe(sentryScope.name);
			expect(outbound?.instrumentationScope.name).toBe(sentryScope.name);
			expect(inbound?.kind).toBe(SpanKind.SERVER);
			expect(outbound?.kind).toBe(SpanKind.INTERNAL);
			// Fastify を通らず `http.route` を持たない受信 span は、送信対象にしない。
			expect(isAllowedCombinedScope('safe', inbound?.instrumentationScope, inbound!, noCapture), JSON.stringify({ name: inbound?.name, attributes: inbound?.attributes })).toBe(false);
			expect(isAllowedCombinedScope('safe', outbound?.instrumentationScope, outbound!, noCapture), JSON.stringify({ name: outbound?.name, attributes: outbound?.attributes })).toBe(true);
		} finally {
			await new Promise<void>((resolve, reject) => server.close(error => error == null ? resolve() : reject(error)));
			await Sentry.close(1000);
			// `Sentry.close()` だけでは global TracerProvider の登録が残り、同じワーカーの後続テストで
			// `Sentry.init()` や `NodeTracerProvider` の再登録と干渉する。
			trace.disable();
			context.disable();
			propagation.disable();
		}
	}, 10000);

	test('fails closed for unknown combined scopes', () => {
		const span = { attributes: {} } as any;
		expect(isAllowedCombinedScope('none', { name: 'misskey-backend' }, span)).toBe(true);
		expect(isAllowedCombinedScope('none', { name: '@opentelemetry/instrumentation-http' }, span)).toBe(false);
		expect(isAllowedCombinedScope('safe', { name: '@sentry/instrumentation-fastify-v3' }, { attributes: { 'http.route': '/notes/:id', 'http.request.method': 'GET', 'sentry.origin': 'auto.http.otel.fastify' }, kind: 1 } as any)).toBe(false);
		expect(isAllowedCombinedScope('safe', { name: 'future-sdk-scope' }, span)).toBe(false);
	});

	test('allows the Sentry Fastify hook and route-handler spans, so hook timings match the OTel-only configuration', () => {
		// combined 構成では Misskey が @fastify/otel を登録しないため、hook span は Sentry の計装から来る。
		const hook = {
			name: '@sentry/instrumentation-fastify - onRequest',
			kind: SpanKind.INTERNAL,
			attributes: {
				'sentry.op': 'hook.fastify',
				'sentry.origin': 'auto.http.otel.fastify',
				'fastify.type': 'hook',
				'hook.callback.name': 'anonymous',
			},
		} as any;
		const handler = {
			name: 'request',
			kind: SpanKind.INTERNAL,
			attributes: {
				'sentry.op': 'request_handler.fastify',
				'sentry.origin': 'auto.http.otel.fastify',
				'http.route': '/notes/:id',
				'http.request.method': 'GET',
			},
		} as any;
		expect(isAllowedCombinedScope('safe', sentryScope, hook, noCapture)).toBe(true);
		expect(isAllowedCombinedScope('safe', sentryScope, handler, noCapture)).toBe(true);
		// `none` では Sentry の自動計装をひとつも再出力しない。
		expect(isAllowedCombinedScope('none', sentryScope, hook, noCapture)).toBe(false);
		// origin と op の組み合わせが崩れたものは通さない。
		expect(isAllowedCombinedScope('safe', sentryScope, { ...hook, attributes: { ...hook.attributes, 'sentry.origin': 'future.fastify.origin' } }, noCapture)).toBe(false);
		expect(isAllowedCombinedScope('safe', sentryScope, { ...hook, attributes: { ...hook.attributes, 'sentry.op': 'future.fastify.op' } }, noCapture)).toBe(false);
		expect(isAllowedCombinedScope('safe', sentryScope, { ...hook, kind: SpanKind.SERVER }, noCapture)).toBe(false);
	});

	test('allows only the Sentry 10.65 PostgreSQL and Redis tuples selected by capture flags', () => {
		const pgQuery = {
			name: 'pg.query:SELECT misskey',
			kind: SpanKind.CLIENT,
			attributes: {
				'db.system': 'postgresql',
				'db.statement': 'DO_NOT_EXPORT',
				'sentry.origin': sentryOrigins.pg,
			},
		} as any;
		expect(isAllowedCombinedScope('safe', sentryScope, pgQuery, noCapture)).toBe(false);
		expect(isAllowedCombinedScope('safe', sentryScope, pgQuery, { ...noCapture, capturePgSpans: true })).toBe(true);
		expect(isAllowedCombinedScope('safe', sentryScope, { ...pgQuery, name: 'future.pg.query' }, { ...noCapture, capturePgSpans: true })).toBe(false);
		expect(isAllowedCombinedScope('safe', sentryScope, { ...pgQuery, kind: SpanKind.INTERNAL }, { ...noCapture, capturePgSpans: true })).toBe(false);
		expect(isAllowedCombinedScope('safe', sentryScope, { ...pgQuery, attributes: { 'sentry.origin': sentryOrigins.pg } }, { ...noCapture, capturePgSpans: true })).toBe(false);
		expect(isAllowedCombinedScope('safe', sentryScope, { ...pgQuery, attributes: { ...pgQuery.attributes, 'sentry.origin': 'future.pg.origin' } }, { ...noCapture, capturePgSpans: true })).toBe(false);
		expect(isAllowedCombinedScope('safe', sentryScope, {
			name: 'pg.connect',
			kind: SpanKind.CLIENT,
			attributes: { 'db.system.name': 'postgresql' },
		} as any, { ...noCapture, capturePgSpans: true, capturePgConnectionSpans: true })).toBe(true);

		const redisCommand = {
			name: 'redis-GET',
			kind: SpanKind.INTERNAL,
			parentSpanContext: { spanId: 'fedcba9876543210' },
			attributes: {
				'db.system.name': 'redis',
				'db.query.text': 'DO_NOT_EXPORT',
				'sentry.op': 'db.redis',
				'sentry.origin': sentryOrigins.redis,
			},
		} as any;
		expect(isAllowedCombinedScope('safe', sentryScope, redisCommand, { ...noCapture, captureRedisCommandSpans: true })).toBe(true);
		expect(isAllowedCombinedScope('safe', sentryScope, { ...redisCommand, parentSpanContext: undefined }, { ...noCapture, captureRedisCommandSpans: true })).toBe(false);
		expect(isAllowedCombinedScope('safe', sentryScope, { ...redisCommand, parentSpanContext: undefined }, { ...noCapture, captureRedisCommandSpans: true, captureRedisRootSpans: true })).toBe(true);
		expect(isAllowedCombinedScope('safe', sentryScope, {
			...redisCommand,
			name: 'redis-connect',
			attributes: { ...redisCommand.attributes, 'sentry.op': 'db.redis.connect' },
		}, { ...noCapture, captureRedisConnectionSpans: true })).toBe(true);
		expect(isAllowedCombinedScope('safe', sentryScope, {
			...redisCommand,
			attributes: { ...redisCommand.attributes, 'sentry.origin': 'future.redis.origin' },
		}, { ...noCapture, captureRedisCommandSpans: true })).toBe(false);
		expect(isAllowedCombinedScope('safe', sentryScope, {
			...redisCommand,
			attributes: { ...redisCommand.attributes, 'db.system.name': undefined },
		}, { ...noCapture, captureRedisCommandSpans: true })).toBe(false);
		expect(isAllowedCombinedScope('safe', sentryScope, {
			...redisCommand,
			kind: SpanKind.CLIENT,
		}, { ...noCapture, captureRedisCommandSpans: true })).toBe(false);
		expect(isAllowedCombinedScope('safe', sentryScope, {
			...redisCommand,
			name: 'future-redis-span',
		}, { ...noCapture, captureRedisCommandSpans: true })).toBe(false);
	});

	test('sentryAutoInstrumentationExport: "none" suppresses PostgreSQL and Redis re-export too, not just HTTP', () => {
		// `none` は個別の capture* 設定にかかわらず、Sentry 自動計装の再出力をすべて止める。
		const allCapture = {
			capturePgSpans: true,
			capturePgConnectionSpans: true,
			captureRedisCommandSpans: true,
			captureRedisConnectionSpans: true,
			captureRedisRootSpans: true,
		};
		const pgQuery = {
			name: 'pg.query:SELECT misskey',
			kind: SpanKind.CLIENT,
			attributes: { 'db.system': 'postgresql', 'sentry.origin': sentryOrigins.pg },
		} as any;
		const pgConnect = {
			name: 'pg.connect',
			kind: SpanKind.CLIENT,
			attributes: { 'db.system.name': 'postgresql' },
		} as any;
		const redisCommand = {
			name: 'redis-GET',
			kind: SpanKind.INTERNAL,
			parentSpanContext: { spanId: 'fedcba9876543210' },
			attributes: { 'db.system.name': 'redis', 'sentry.op': 'db.redis', 'sentry.origin': sentryOrigins.redis },
		} as any;
		const redisConnect = {
			name: 'redis-connect',
			kind: SpanKind.INTERNAL,
			attributes: { 'db.system.name': 'redis', 'sentry.op': 'db.redis.connect', 'sentry.origin': sentryOrigins.redis },
		} as any;

		expect(isAllowedCombinedScope('none', sentryScope, pgQuery, allCapture)).toBe(false);
		expect(isAllowedCombinedScope('none', sentryScope, pgConnect, allCapture)).toBe(false);
		expect(isAllowedCombinedScope('none', sentryScope, redisCommand, allCapture)).toBe(false);
		expect(isAllowedCombinedScope('none', sentryScope, redisConnect, allCapture)).toBe(false);

		// 同じ fixture と capture* 設定でも、`safe` なら許可される。
		expect(isAllowedCombinedScope('safe', sentryScope, pgQuery, allCapture)).toBe(true);
		expect(isAllowedCombinedScope('safe', sentryScope, pgConnect, allCapture)).toBe(true);
		expect(isAllowedCombinedScope('safe', sentryScope, redisCommand, allCapture)).toBe(true);
		expect(isAllowedCombinedScope('safe', sentryScope, redisConnect, allCapture)).toBe(true);
	});

	test('allows only installed Sentry HTTP server and client tuples in safe mode', () => {
		const server = {
			name: 'POST /webhook/DO_NOT_EXPORT',
			kind: SpanKind.SERVER,
			attributes: {
				'http.method': 'POST',
				'http.route': '/webhook/:token',
				'sentry.op': 'http.server',
				'sentry.origin': sentryOrigins.httpServer,
			},
		} as any;
		expect(isAllowedCombinedScope('none', sentryScope, server, noCapture)).toBe(false);
		expect(isAllowedCombinedScope('safe', sentryScope, server, noCapture)).toBe(true);
		expect(isAllowedCombinedScope('safe', sentryScope, { ...server, kind: SpanKind.CLIENT }, noCapture)).toBe(false);
		expect(isAllowedCombinedScope('safe', sentryScope, { ...server, attributes: { ...server.attributes, 'sentry.origin': 'future.http.server' } }, noCapture)).toBe(false);
		expect(isAllowedCombinedScope('safe', sentryScope, { ...server, attributes: { ...server.attributes, 'http.route': undefined } }, noCapture)).toBe(false);

		const client = {
			name: 'GET https://host.test/DO_NOT_EXPORT',
			kind: SpanKind.INTERNAL,
			attributes: {
				'http.request.method': 'GET',
				'url.full': 'https://host.test/DO_NOT_EXPORT',
				'sentry.op': 'http.client',
				'sentry.origin': sentryOrigins.httpClient,
			},
		} as any;
		expect(isAllowedCombinedScope('safe', sentryScope, client, noCapture)).toBe(true);
		expect(isAllowedCombinedScope('safe', sentryScope, { ...client, attributes: { ...client.attributes, 'sentry.op': undefined } }, noCapture)).toBe(false);
		expect(isAllowedCombinedScope('safe', sentryScope, { ...client, attributes: { ...client.attributes, 'url.full': undefined } }, noCapture)).toBe(false);

		// native fetch の span は専用の origin を使い `sentry.op` を持たないため、その組み合わせを確認する。
		const fetchClient = {
			name: 'GET https://host.test/DO_NOT_EXPORT',
			kind: SpanKind.CLIENT,
			attributes: {
				'http.request.method': 'GET',
				'url.full': 'https://host.test/DO_NOT_EXPORT',
				'server.address': 'host.test',
				'sentry.origin': 'auto.http.otel.node_fetch',
			},
		} as any;
		expect(isAllowedCombinedScope('none', sentryScope, fetchClient, noCapture)).toBe(false);
		expect(isAllowedCombinedScope('safe', sentryScope, fetchClient, noCapture)).toBe(true);
		// 分岐は完全一致であること (origin/kind/必須属性のいずれが欠けても通さない)。
		expect(isAllowedCombinedScope('safe', sentryScope, { ...fetchClient, kind: SpanKind.INTERNAL }, noCapture)).toBe(false);
		expect(isAllowedCombinedScope('safe', sentryScope, { ...fetchClient, attributes: { ...fetchClient.attributes, 'sentry.origin': 'future.http.node_fetch' } }, noCapture)).toBe(false);
		expect(isAllowedCombinedScope('safe', sentryScope, { ...fetchClient, attributes: { ...fetchClient.attributes, 'url.full': undefined } }, noCapture)).toBe(false);
		expect(isAllowedCombinedScope('safe', sentryScope, { ...fetchClient, attributes: { ...fetchClient.attributes, 'http.request.method': undefined } }, noCapture)).toBe(false);
	});

	test('exports inbound spans for static routes in combined safe mode', () => {
		// パラメータを持たない静的な route template も許可する。
		const span = { kind: SpanKind.SERVER, name: 'POST /api/notes/create', attributes: {
			'http.method': 'POST', 'http.route': '/api/notes/create',
			'sentry.op': 'http.server', 'sentry.origin': 'auto.http.otel.http' } } as any;
		expect(isAllowedCombinedScope('safe', { name: '@sentry/node' }, span, noCapture)).toBe(true);
	});

	test('accepts the current http.request.method name for inbound spans too, not only the legacy http.method (fail-open instead of silently no longer exporting HTTP server spans if the SDK stops setting the deprecated name)', () => {
		const span = { kind: SpanKind.SERVER, name: 'POST /api/notes/create', attributes: {
			'http.request.method': 'POST', 'http.route': '/api/notes/create',
			'sentry.op': 'http.server', 'sentry.origin': 'auto.http.otel.http' } } as any;
		expect(isAllowedCombinedScope('safe', { name: '@sentry/node' }, span, noCapture)).toBe(true);
	});

	test('preserves safe manual names and redacts secret-bearing names', () => {
		const base = { attributes: {}, events: [], links: [], status: { code: 0 }, resource: { attributes: {} }, instrumentationScope: { name: 'misskey-backend' }, kind: 1, startTime: [1, 0], endTime: [1, 1], spanContext: () => ({ traceId: '0123456789abcdef0123456789abcdef', spanId: '0123456789abcdef', traceFlags: 1, isRemote: false }) };
		expect(createSanitizedReadableSpan({ ...base, name: 'API: notes/show' } as any)?.name).toBe('API: notes/show');
		expect(createSanitizedReadableSpan({ ...base, name: 'Queue: deliver job' } as any)?.name).toBe('Queue: deliver job');
		expect(createSanitizedReadableSpan({ ...base, name: 'API: /x?token=DO_NOT_EXPORT' } as any)?.name).toBe('[redacted]');
	});

	test('rebuilds the name from METHOD+route even when the raw span name carries the unmatched raw request path (load-bearing: Sentry names inbound root spans from the raw path, not http.route)', () => {
		// Sentry の受信 span 名には生 path が入りうるため、route template から名前を作り直す。
		const base = { attributes: {}, events: [], links: [], status: { code: 0 }, resource: { attributes: {} }, instrumentationScope: { name: '@sentry/node' }, kind: 1, startTime: [1, 0], endTime: [1, 1], spanContext: () => ({ traceId: '0123456789abcdef0123456789abcdef', spanId: '0123456789abcdef', traceFlags: 1, isRemote: false }) };
		const span = { ...base, name: 'GET /api/throws/PARAM_SECRET_VALUE', attributes: { 'http.request.method': 'GET', 'http.route': '/api/throws/:id' } };
		const exported = createSanitizedReadableSpan(span as any);
		expect(exported?.name).toBe('GET /api/throws/:id');
		expect(JSON.stringify(exported)).not.toContain('PARAM_SECRET_VALUE');
	});

	test('preserves db instrumentation verb-form names (pg.query:SELECT <db>, pg.connect, redis-<cmd>, MULTI/PIPELINE) as-is', () => {
		const base = { attributes: {}, events: [], links: [], status: { code: 0 }, resource: { attributes: {} }, instrumentationScope: { name: '@opentelemetry/instrumentation-pg' }, kind: 2, startTime: [1, 0], endTime: [1, 1], spanContext: () => ({ traceId: '0123456789abcdef0123456789abcdef', spanId: '0123456789abcdef', traceFlags: 1, isRemote: false }) };
		expect(createSanitizedReadableSpan({ ...base, name: 'pg.query:SELECT misskey' } as any)?.name).toBe('pg.query:SELECT misskey');
		expect(createSanitizedReadableSpan({ ...base, name: 'pg.connect' } as any)?.name).toBe('pg.connect');
		expect(createSanitizedReadableSpan({ ...base, name: 'redis-GET' } as any)?.name).toBe('redis-GET');
		expect(createSanitizedReadableSpan({ ...base, name: 'MULTI' } as any)?.name).toBe('MULTI');
		expect(createSanitizedReadableSpan({ ...base, name: 'future.pg.verb' } as any)?.name).toBe('[redacted]');
	});

	test('keeps the span names Misskey\'s own Redis instrumentation actually produces (OTel-only has no scope gate, so safeName is the only filter)', () => {
		const base = { attributes: {}, events: [], links: [], status: { code: 0 }, resource: { attributes: {} }, instrumentationScope: { name: 'misskey-backend' }, kind: 2, startTime: [1, 0], endTime: [1, 1], spanContext: () => ({ traceId: '0123456789abcdef0123456789abcdef', spanId: '0123456789abcdef', traceFlags: 1, isRemote: false }) };
		expect(createSanitizedReadableSpan({ ...base, name: 'redis-get' } as any)?.name).toBe('redis-get');
		expect(createSanitizedReadableSpan({ ...base, name: 'redis-connect' } as any)?.name).toBe('redis-connect');
		// 素のコマンド名は許可せず、名前規則を広げない。
		expect(createSanitizedReadableSpan({ ...base, name: 'get' } as any)?.name).toBe('[redacted]');
		expect(createSanitizedReadableSpan({ ...base, name: 'connect' } as any)?.name).toBe('[redacted]');
	});

	test('restores resource attributes for service/telemetry/runtime prefixes and operator-registered keys, but drops host identifiers', () => {
		const base = { attributes: {}, events: [], links: [], status: { code: 0 }, instrumentationScope: { name: 'misskey-backend' }, kind: 1, startTime: [1, 0], endTime: [1, 1], name: 'API: notes/show', spanContext: () => ({ traceId: '0123456789abcdef0123456789abcdef', spanId: '0123456789abcdef', traceFlags: 1, isRemote: false }) };
		const span = {
			...base,
			resource: { attributes: {
				'service.name': 'misskey-backend',
				'telemetry.sdk.name': 'opentelemetry',
				'telemetry.sdk.language': 'nodejs',
				'process.runtime.name': 'nodejs',
				'misskey.process.role': 'primary-server',
				// otelForBackend.resourceAttributes で operator が宣言したキー。policy に渡していれば残る。
				'deployment.environment': 'production',
				// resource はリクエスト由来ではないが、ホスト環境の特定に使える情報は引き続き落とす。
				'host.name': 'DO_NOT_EXPORT',
				'process.pid': 1234,
				'process.command_args': 'DO_NOT_EXPORT',
				// 登録していないキーは operator 宣言扱いにならず、そのまま落ちる。
				'custom.unregistered': 'DO_NOT_EXPORT',
			} },
		};
		// 運用者定義の許可キーは、processor ごとの policy に閉じ込める。
		const exported = createSanitizedReadableSpan(span as any, undefined, { allowedResourceKeys: new Set(['deployment.environment']) });
		expect(exported?.resource?.attributes).toEqual({
			'service.name': 'misskey-backend',
			'telemetry.sdk.name': 'opentelemetry',
			'telemetry.sdk.language': 'nodejs',
			'process.runtime.name': 'nodejs',
			'misskey.process.role': 'primary-server',
			'deployment.environment': 'production',
		});
		expect(JSON.stringify(exported)).not.toContain('DO_NOT_EXPORT');
	});

	test('keeps real instrumentation scope names by format while the combined export allowlist stays exact', () => {
		const base = { attributes: {}, events: [], links: [], status: { code: 0 }, resource: { attributes: {} }, kind: 1, startTime: [1, 0], endTime: [1, 1], name: 'GET /', spanContext: () => ({ traceId: '0123456789abcdef0123456789abcdef', spanId: '0123456789abcdef', traceFlags: 1, isRemote: false }) };
		expect(createSanitizedReadableSpan({ ...base, instrumentationScope: { name: '@fastify/otel' } } as any)?.instrumentationScope?.name).toBe('@fastify/otel');
		expect(createSanitizedReadableSpan({ ...base, instrumentationScope: { name: '@opentelemetry/instrumentation-pg' } } as any)?.instrumentationScope?.name).toBe('@opentelemetry/instrumentation-pg');
		// 表示用の形式検証とは別に、combined 構成の出力可否は完全一致で判定する。
		expect(isAllowedCombinedScope('safe', { name: '@opentelemetry/instrumentation-http' }, { attributes: {} } as any)).toBe(false);
	});

	describe('db.statement opt-in policy (capturePgStatement)', () => {
		const pgSpan = {
			attributes: { 'db.system.name': 'postgresql', 'db.statement': 'SELECT * FROM notes WHERE id = $1' },
			events: [], links: [], status: { code: 0 }, resource: { attributes: {} },
			instrumentationScope: { name: '@opentelemetry/instrumentation-pg' }, kind: 2, startTime: [1, 0], endTime: [1, 1], name: 'pg.query:SELECT',
			spanContext: () => ({ traceId: '0123456789abcdef0123456789abcdef', spanId: '0123456789abcdef', traceFlags: 1, isRemote: false }),
		};

		test('drops db.statement when no policy is given (matches the pre-existing default)', () => {
			expect(createSanitizedReadableSpan(pgSpan as any)?.attributes).not.toHaveProperty('db.statement');
		});

		test('passes db.statement through createSanitizedReadableSpan only when the caller explicitly sets allowDbStatement', () => {
			const exported = createSanitizedReadableSpan(pgSpan as any, undefined, { allowDbStatement: true });
			expect(exported?.attributes['db.statement']).toBe('SELECT * FROM notes WHERE id = $1');
		});

		test('SanitizingSpanProcessor only forwards db.statement when constructed with an explicit allowDbStatement policy', () => {
			const withoutPolicy = { onStart: vi.fn(), onEnd: vi.fn(), forceFlush: vi.fn(), shutdown: vi.fn() };
			new SanitizingSpanProcessor(withoutPolicy as any).onEnd(pgSpan as any);
			expect(withoutPolicy.onEnd.mock.calls[0][0].attributes).not.toHaveProperty('db.statement');

			const withPolicy = { onStart: vi.fn(), onEnd: vi.fn(), forceFlush: vi.fn(), shutdown: vi.fn() };
			// 第2引数(shouldExport)はundefinedのまま既定値を使い、第3引数だけでpolicyを指定できることを確認する。
			new SanitizingSpanProcessor(withPolicy as any, undefined, { allowDbStatement: true }).onEnd(pgSpan as any);
			expect(withPolicy.onEnd.mock.calls[0][0].attributes['db.statement']).toBe('SELECT * FROM notes WHERE id = $1');
		});
	});
});
