/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test, vi } from 'vitest';
import { SpanKind, SpanStatusCode } from '@opentelemetry/api';
import { createRedisInstrumentation } from '@/core/telemetry/redis-instrumentation.js';

describe('redis-instrumentation', () => {
	test('creates and completes a span for an ioredis command', () => {
		let subscribers: any;
		const unsubscribe = vi.fn();
		const span = { end: vi.fn(), recordException: vi.fn(), setStatus: vi.fn(), setAttribute: vi.fn() };
		const tracer = { startSpan: vi.fn(() => span) };
		const uninstall = createRedisInstrumentation({
			tracingChannel: () => ({ subscribe: (value) => { subscribers = value; }, unsubscribe }),
			tracer: tracer as any,
			getActiveSpan: () => ({}) as any,
			spanKindClient: SpanKind.CLIENT,
			spanStatusCodeError: SpanStatusCode.ERROR,
		}, { captureCommandSpans: true });
		const command = { command: 'get', args: ['key'], database: 0, serverAddress: 'redis', serverPort: 6379 };

		subscribers.start(command);
		subscribers.asyncEnd(command);

		expect(tracer.startSpan).toHaveBeenCalledWith('get', expect.objectContaining({
			kind: SpanKind.CLIENT,
			attributes: expect.objectContaining({
				'db.system.name': 'redis',
				'db.operation.name': 'get',
				'server.address': 'redis',
				'server.port': 6379,
			}),
		}));
		expect(span.end).toHaveBeenCalledOnce();

		uninstall();
		expect(unsubscribe).toHaveBeenCalledWith(subscribers);
	});

	test('records rejected Redis commands as errors', () => {
		let subscribers: any;
		const span = { end: vi.fn(), recordException: vi.fn(), setStatus: vi.fn(), setAttribute: vi.fn() };
		createRedisInstrumentation({
			tracingChannel: () => ({ subscribe: (value) => { subscribers = value; }, unsubscribe: vi.fn() }),
			tracer: { startSpan: vi.fn(() => span) } as any,
			getActiveSpan: () => ({}) as any,
			spanKindClient: SpanKind.CLIENT,
			spanStatusCodeError: SpanStatusCode.ERROR,
		}, { captureCommandSpans: true });
		const command = { command: 'get', args: ['key'], database: 0, serverAddress: 'redis', serverPort: undefined };
		const error = Object.assign(new Error('ERR Redis failed'), { code: 'ERR' });

		subscribers.start(command);
		Object.assign(command, { error });
		subscribers.error(command);
		subscribers.asyncEnd(command);

		expect(span.recordException).toHaveBeenCalledWith(error);
		expect(span.recordException).toHaveBeenCalledOnce();
		expect(span.setStatus).toHaveBeenCalledWith({ code: SpanStatusCode.ERROR, message: 'ERR Redis failed' });
		expect(span.setAttribute).toHaveBeenCalledWith('error.type', 'ERR');
		expect(span.setAttribute).toHaveBeenCalledWith('db.response.status_code', 'ERR');
		expect(span.end).toHaveBeenCalledOnce();
	});

	test('does not create a root span when no parent span is active', () => {
		let subscribers: any;
		const tracer = { startSpan: vi.fn() };
		createRedisInstrumentation({
			tracingChannel: () => ({ subscribe: (value) => { subscribers = value; }, unsubscribe: vi.fn() }),
			tracer: tracer as any,
			getActiveSpan: () => undefined,
			spanKindClient: SpanKind.CLIENT,
			spanStatusCodeError: SpanStatusCode.ERROR,
		}, { captureCommandSpans: true });

		subscribers.start({ command: 'get', args: ['key'], database: 0, serverAddress: 'redis', serverPort: 6379 });

		expect(tracer.startSpan).not.toHaveBeenCalled();
	});

	test('creates a root span when explicitly enabled', () => {
		let subscribers: any;
		const span = { end: vi.fn(), recordException: vi.fn(), setStatus: vi.fn(), setAttribute: vi.fn() };
		const tracer = { startSpan: vi.fn(() => span) };
		createRedisInstrumentation({
			tracingChannel: () => ({ subscribe: (value) => { subscribers = value; }, unsubscribe: vi.fn() }),
			tracer: tracer as any,
			getActiveSpan: () => undefined,
			spanKindClient: SpanKind.CLIENT,
			spanStatusCodeError: SpanStatusCode.ERROR,
		}, { captureCommandSpans: true, requireParentSpan: false });

		const command = { command: 'get', args: ['key'], database: 0, serverAddress: 'redis', serverPort: 6379 };
		subscribers.start(command);
		subscribers.asyncEnd(command);

		expect(tracer.startSpan).toHaveBeenCalledOnce();
		expect(span.end).toHaveBeenCalledOnce();
	});

	test('records connection spans only when explicitly enabled', () => {
		const subscribers = new Map<string, any>();
		const unsubscribe = vi.fn();
		const span = { end: vi.fn(), recordException: vi.fn(), setStatus: vi.fn(), setAttribute: vi.fn() };
		const tracer = { startSpan: vi.fn(() => span) };
		const uninstall = createRedisInstrumentation({
			tracingChannel: (name) => ({ subscribe: (value) => { subscribers.set(name, value); }, unsubscribe }),
			tracer: tracer as any,
			getActiveSpan: () => undefined,
			spanKindClient: SpanKind.CLIENT,
			spanStatusCodeError: SpanStatusCode.ERROR,
		}, { captureConnectionSpans: true });

		const connection = { serverAddress: 'redis', serverPort: 6379 };
		subscribers.get('ioredis:connect').start(connection);
		subscribers.get('ioredis:connect').asyncEnd(connection);

		expect(tracer.startSpan).toHaveBeenCalledWith('connect', expect.objectContaining({
			kind: SpanKind.CLIENT,
			attributes: expect.objectContaining({
				'db.operation.name': 'connect',
				'server.address': 'redis',
				'server.port': 6379,
			}),
		}));
		expect(span.end).toHaveBeenCalledOnce();

		uninstall();
		expect(unsubscribe).toHaveBeenCalledWith(subscribers.get('ioredis:connect'));
	});

	test('does not subscribe to Redis command diagnostics unless explicitly enabled', () => {
		const tracingChannel = vi.fn();
		createRedisInstrumentation({
			tracingChannel,
			tracer: { startSpan: vi.fn() } as any,
			getActiveSpan: () => undefined,
			spanKindClient: SpanKind.CLIENT,
			spanStatusCodeError: SpanStatusCode.ERROR,
		});

		expect(tracingChannel).not.toHaveBeenCalled();
	});
});
