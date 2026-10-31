/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test, vi } from 'vitest';
import { createSanitizedReadableSpan, SanitizingSpanProcessor } from '@/core/telemetry/SanitizingSpanProcessor.js';
import { exceptionMessageMaxBytes, exceptionStacktraceMaxBytes } from '@/core/telemetry/sanitizer/text.js';

const traceId = '0123456789abcdef0123456789abcdef';
const spanId = '0123456789abcdef';

function createSpan(overrides: Record<string, unknown> = {}): any {
	return {
		name: 'API: notes/show',
		kind: 1,
		attributes: {},
		events: [],
		links: [],
		status: { code: 0 },
		resource: { attributes: {} },
		instrumentationScope: { name: 'misskey-backend' },
		startTime: [1, 0],
		endTime: [1, 1],
		duration: [0, 1],
		ended: true,
		droppedAttributesCount: 0,
		droppedEventsCount: 0,
		droppedLinksCount: 0,
		spanContext: () => ({ traceId, spanId, traceFlags: 1, isRemote: false }),
		...overrides,
	};
}

function exceptionAttributes(span: unknown, index = 0): Record<string, string> {
	return (span as { events: Array<{ attributes: Record<string, string> }> }).events[index].attributes;
}

describe('SanitizingSpanProcessor', () => {
	test('absorbs downstream forceFlush/shutdown failures whether they throw or reject', async () => {
		// MultiSpanProcessor.shutdown() は Promise.all の reject をそのまま返すため、
		// 下流の送信失敗を吸収しないと provider 全体の終了処理が失敗になる。
		const rejecting = {
			onStart: vi.fn(), onEnd: vi.fn(),
			forceFlush: vi.fn(async () => { throw new Error('flush failed'); }),
			shutdown: vi.fn(async () => { throw new Error('shutdown failed'); }),
		};
		await expect(new SanitizingSpanProcessor(rejecting).forceFlush()).resolves.toBeUndefined();
		await expect(new SanitizingSpanProcessor(rejecting).shutdown()).resolves.toBeUndefined();

		const throwing = {
			onStart: vi.fn(), onEnd: vi.fn(),
			forceFlush: vi.fn(() => { throw new Error('flush failed'); }),
			shutdown: vi.fn(() => { throw new Error('shutdown failed'); }),
		};
		await expect(new SanitizingSpanProcessor(throwing).forceFlush()).resolves.toBeUndefined();
		await expect(new SanitizingSpanProcessor(throwing).shutdown()).resolves.toBeUndefined();
	});

	test('exports only a sanitized detached copy and never forwards onStart', () => {
		const downstream = { onStart: vi.fn(), onEnd: vi.fn(), forceFlush: vi.fn(), shutdown: vi.fn() };
		const processor = new SanitizingSpanProcessor(downstream);
		const span = createSpan({
			name: 'POST /notes/:id',
			attributes: { 'url.path': '/notes/1?i=DO_NOT_EXPORT', 'http.route': '/notes/:id', 'http.request.method': 'POST' },
			status: { code: 2, message: 'DO_NOT_EXPORT' },
			parentSpanContext: { traceId, spanId: 'fedcba9876543210', traceFlags: 1, isRemote: true, traceState: { private: 'DO_NOT_EXPORT' } },
			spanContext: () => ({ traceId, spanId, traceFlags: 1, isRemote: false, traceState: { canary: 'DO_NOT_EXPORT' } }),
		});
		processor.onStart(span, {} as any);
		processor.onEnd(span);

		expect(downstream.onStart).not.toHaveBeenCalled();
		const exported = downstream.onEnd.mock.calls[0][0];
		expect(exported).not.toBe(span);
		expect(exported.name).toBe('POST /notes/:id');
		expect(exported.attributes).toEqual({ 'http.route': '/notes/:id', 'http.request.method': 'POST' });
		// status.message は自由記述を含みうるため code だけを残す。
		expect(exported.status).toEqual({ code: 2 });
		expect(exported.spanContext()).toEqual({ traceId, spanId, traceFlags: 1, isRemote: false });
		expect(exported.parentSpanContext).toEqual({ traceId, spanId: 'fedcba9876543210', traceFlags: 1, isRemote: true });
		expect(JSON.stringify({ ...exported, spanContext: exported.spanContext() })).not.toContain('DO_NOT_EXPORT');
	});

	test('passes the original resource and instrumentation scope objects through', () => {
		// OTLP exporter は resource をオブジェクトの同一性でまとめるため、作り直すとバッチが span ごとに分割される。
		const resource = { attributes: { 'service.name': 'misskey-backend' } };
		const instrumentationScope = { name: '@fastify/otel', version: '0.21.1' };
		const exported = createSanitizedReadableSpan(createSpan({ resource, instrumentationScope }));
		expect(exported?.resource).toBe(resource);
		expect(exported?.instrumentationScope).toBe(instrumentationScope);
	});

	test('applies the db statement policy', () => {
		const span = createSpan({ name: 'pg.query:SELECT misskey', attributes: { 'db.system.name': 'postgresql', 'db.query.text': 'SELECT 1' } });
		expect(createSanitizedReadableSpan(span)?.attributes).toEqual({ 'db.system.name': 'postgresql' });
		expect(createSanitizedReadableSpan(span, { allowDbStatement: true })?.attributes).toEqual({ 'db.system.name': 'postgresql', 'db.query.text': 'SELECT 1' });
	});

	test('rebuilds HTTP span names from the sanitized method and route or host', () => {
		// 受信 span は計装が付けた名前を使わず、method と route から作り直す。
		expect(createSanitizedReadableSpan(createSpan({
			name: 'GET /notes/DO_NOT_EXPORT?i=DO_NOT_EXPORT',
			attributes: { 'http.request.method': 'GET', 'http.route': '/notes/:id', 'url.path': '/notes/DO_NOT_EXPORT?i=DO_NOT_EXPORT' },
		}))?.name).toBe('GET /notes/:id');
		// 送信 span は method と送信先 host (port を含む) から作り直す。
		expect(createSanitizedReadableSpan(createSpan({
			name: 'POST https://remote.example:8443/inbox/DO_NOT_EXPORT',
			attributes: { 'http.request.method': 'POST', 'url.full': 'https://remote.example:8443/inbox/DO_NOT_EXPORT' },
		}))?.name).toBe('POST remote.example:8443');
		// Fastify の hook span は method を持たないため、hook 名をそのまま使う。
		expect(createSanitizedReadableSpan(createSpan({
			name: 'fastify -> @fastify/otel - route -> onRequest',
			attributes: { 'fastify.type': 'route-hook', 'http.route': '/notes/:id' },
		}))?.name).toBe('fastify -> @fastify/otel - route -> onRequest');
		// route に一致しなかった受信 span は、計装の固定名 (`request`) を使う。
		expect(createSanitizedReadableSpan(createSpan({
			name: 'request',
			attributes: { 'http.request.method': 'GET', 'url.path': '/DO_NOT_EXPORT' },
		}))?.name).toBe('request');
	});

	test('strips control characters from span names and bounds their length', () => {
		expect(createSanitizedReadableSpan(createSpan({ name: 'API: notes/show\r\n\x1b[31mFAKE' }))?.name).toBe('API: notes/show[31mFAKE');
		expect(Buffer.byteLength(createSanitizedReadableSpan(createSpan({ name: 'a'.repeat(1000) }))!.name, 'utf-8')).toBeLessThanOrEqual(256);
		expect(createSanitizedReadableSpan(createSpan({ name: '\x00' }))?.name).toBe('[redacted]');
	});

	test('drops spans with a malformed trace or span id', () => {
		expect(createSanitizedReadableSpan(createSpan({ spanContext: () => ({ traceId: '0'.repeat(32), spanId, traceFlags: 1, isRemote: false }) }))).toBeUndefined();
		expect(createSanitizedReadableSpan(createSpan({ spanContext: () => ({ traceId, spanId: 'not-a-span-id', traceFlags: 1, isRemote: false }) }))).toBeUndefined();
	});

	test('never forwards the raw span when sanitizing throws', () => {
		const downstream = { onStart: vi.fn(), onEnd: vi.fn(), forceFlush: vi.fn(), shutdown: vi.fn() };
		new SanitizingSpanProcessor(downstream).onEnd(createSpan({ spanContext: () => { throw new Error('boom'); } }));
		expect(downstream.onEnd).not.toHaveBeenCalled();
	});

	test('normalizes unknown parent trace flags without discarding an otherwise valid parent context', () => {
		const parentSpanId = 'fedcba9876543210';
		for (const traceFlags of [undefined, 2]) {
			const exported = createSanitizedReadableSpan(createSpan({
				parentSpanContext: { traceId, spanId: parentSpanId, traceFlags, isRemote: true },
			}));
			expect(exported?.parentSpanContext).toEqual({ traceId, spanId: parentSpanId, traceFlags: 0, isRemote: true });
		}

		const wrongTrace = createSanitizedReadableSpan(createSpan({
			parentSpanContext: { traceId: 'fedcba9876543210fedcba9876543210', spanId: parentSpanId, traceFlags: 1 },
		}));
		expect(wrongTrace?.parentSpanContext).toBeUndefined();
	});

	test('keeps exception type/message/stacktrace on exception events, drops non-exception events entirely, and links keep only their trace identity', () => {
		const exported = createSanitizedReadableSpan(createSpan({
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
		}));
		expect(exported?.events).toEqual([{ name: 'exception', time: [1, 0], droppedAttributesCount: 0, attributes: { 'exception.type': 'TypeError', 'exception.message': 'boom at foo.ts:1', 'exception.stacktrace': 'TypeError: boom    at foo (foo.ts:1:1)' } }]);
		expect(exported?.links).toEqual([{ context: { traceId: 'fedcba9876543210fedcba9876543210', spanId: 'fedcba9876543210', traceFlags: 1, isRemote: true } }]);
		expect(JSON.stringify(exported)).not.toContain('DO_NOT_EXPORT');
	});

	test('strips C0, DEL and C1 control characters from exception.message and exception.stacktrace but keeps tabs', () => {
		const exported = createSanitizedReadableSpan(createSpan({
			events: [
				// \u009b は 8-bit CSI、\b は backspace、\x7f は DEL として除去対象にする。
				{ name: 'exception', time: [1, 0], attributes: { 'exception.type': 'TypeError', 'exception.message': 'a\u009b31mFAKE\b\x7fb\tc\r\n\x00\x1b[31m', 'exception.stacktrace': 'control chars\r\n\x00\x1b[31m' } },
			],
		}));
		expect(exceptionAttributes(exported)['exception.message']).toBe('a31mFAKEb\tc[31m');
		expect(exceptionAttributes(exported)['exception.stacktrace']).toBe('control chars[31m');
	});

	test('truncates an oversized exception.stacktrace instead of dropping the whole span (boot/entry.ts sets Error.stackTraceLimit = Infinity)', () => {
		const hugeStacktrace = 'TypeError: boom ' + '    at frame (file.ts:1:1) '.repeat(4000); // 約108KB
		expect(Buffer.byteLength(hugeStacktrace, 'utf-8')).toBeGreaterThan(64 * 1024);

		const exported = createSanitizedReadableSpan(createSpan({
			status: { code: 2 },
			events: [{ name: 'exception', time: [1, 0], attributes: { 'exception.type': 'TypeError', 'exception.message': 'boom', 'exception.stacktrace': hugeStacktrace } }],
		}));

		expect(exported).not.toBeUndefined();
		expect(exported?.status).toEqual({ code: 2 });
		const stacktrace = exceptionAttributes(exported)['exception.stacktrace'];
		expect(Buffer.byteLength(stacktrace, 'utf-8')).toBeLessThanOrEqual(exceptionStacktraceMaxBytes);
		expect(hugeStacktrace.startsWith(stacktrace)).toBe(true);
	});

	test('never drops the span itself when maxEvents maximal exceptions exceed the budget after JSON escaping', () => {
		// JSON 化で膨張する例外を複数与え、全体上限まで event を減らして span を残すことを確認する。
		const hugeMessage = '"'.repeat(40000);
		const hugeStacktrace = '\\'.repeat(40000);
		const exported = createSanitizedReadableSpan(createSpan({
			status: { code: 2 },
			events: Array.from({ length: 6 }, () => ({ name: 'exception', time: [1, 0], attributes: { 'exception.type': 'TypeError', 'exception.message': hugeMessage, 'exception.stacktrace': hugeStacktrace } })),
		}));

		expect(exported).not.toBeUndefined();
		expect(exported?.status).toEqual({ code: 2 });
		expect(exported?.name).toBe('API: notes/show');
		expect(exported?.events.length).toBeGreaterThan(0);
		expect(exported?.events.length).toBeLessThanOrEqual(4);
		for (let i = 0; i < (exported?.events.length ?? 0); i++) {
			const attributes = exceptionAttributes(exported, i);
			expect(Buffer.byteLength(attributes['exception.message'], 'utf-8')).toBeLessThanOrEqual(exceptionMessageMaxBytes);
			expect(Buffer.byteLength(attributes['exception.stacktrace'], 'utf-8')).toBeLessThanOrEqual(exceptionStacktraceMaxBytes);
		}
		expect(Buffer.byteLength(JSON.stringify(exported?.events), 'utf-8')).toBeLessThanOrEqual(64 * 1024);
	});

	test('reports droppedEventsCount as the SDK\'s own count plus what the sanitizer removed', () => {
		const exceptionEvent = { name: 'exception', time: [1, 0], attributes: { 'exception.type': 'TypeError', 'exception.message': 'boom' } };

		// SDK と sanitizer の両方が破棄した event を合算する。
		expect(createSanitizedReadableSpan(createSpan({ events: [exceptionEvent], droppedEventsCount: 3 }))?.droppedEventsCount).toBe(3);
		// exception 以外の event も破棄数に含める。
		expect(createSanitizedReadableSpan(createSpan({ events: [exceptionEvent, { name: 'log', time: [1, 0], attributes: {} }] }))?.droppedEventsCount).toBe(1);
		// event 数の上限による打ち切りも含める。
		expect(createSanitizedReadableSpan(createSpan({ events: Array.from({ length: 6 }, () => exceptionEvent), droppedEventsCount: 2 }))?.droppedEventsCount).toBe(4);
		// events が配列でなくても、安全な空配列として span を処理する。
		const malformed = createSanitizedReadableSpan(createSpan({ events: 'not-an-array' }));
		expect(malformed).not.toBeUndefined();
		expect(malformed?.events).toEqual([]);
		expect(malformed?.droppedEventsCount).toBe(0);
	});

	test('drops links with a malformed trace or span id', () => {
		const exported = createSanitizedReadableSpan(createSpan({
			links: [
				{ context: { traceId: 'not-a-trace-id', spanId: '2'.repeat(16) } },
				{ context: { traceId: '1'.repeat(32), spanId: 'not-a-span-id' } },
				{ context: { traceId: '1'.repeat(32), spanId: '2'.repeat(16) } },
			],
		}));
		// traceFlags/isRemote が未設定の場合は安全側 (0/false) を補って作り直す。
		expect(exported?.links).toEqual([{ context: { traceId: '1'.repeat(32), spanId: '2'.repeat(16), traceFlags: 0, isRemote: false } }]);
	});

	test('truncates events and links to their configured maximum', () => {
		const exported = createSanitizedReadableSpan(createSpan({
			events: Array.from({ length: 6 }, () => ({ name: 'exception', time: [1, 0], attributes: { 'exception.type': 'TypeError' } })),
			links: Array.from({ length: 10 }, () => ({ context: { traceId: '1'.repeat(32), spanId: '2'.repeat(16), traceFlags: 1, isRemote: false } })),
		}));
		expect(exported?.events).toHaveLength(4);
		expect(exported?.links).toHaveLength(8);
	});
});
