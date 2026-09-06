/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test, vi } from 'vitest';
import { SpanStatusCode } from '@opentelemetry/api';
import type { Context, SpanContext } from '@opentelemetry/api';
import { executeSpan, getQueueSpanContext, getQueueTraceContextMode, injectActiveTraceContext, injectQueueTraceContext, recordSpanError, startSpanWithQueueTraceContext } from '@/core/telemetry/queue-trace-context.js';

const rootContext = { kind: 'root' } as unknown as Context;
const extractedContext = { kind: 'extracted' } as unknown as Context;
const sourceSpanContext: SpanContext = {
	traceId: '0123456789abcdef0123456789abcdef',
	spanId: '0123456789abcdef',
	traceFlags: 1,
	isRemote: true,
};

function jobData() {
	return {
		name: 'deliver',
		__misskeyTraceContext: {
			traceparent: '00-0123456789abcdef0123456789abcdef-0123456789abcdef-01',
		},
	};
}

describe('queue-trace-context', () => {
	test('stores only a non-empty carrier in the job data', () => {
		const data = { noteId: '9d6b9a65-46c9-4e1b-a640-9589693893c9' };

		injectQueueTraceContext(data, carrier => {
			carrier['traceparent'] = '00-0123456789abcdef0123456789abcdef-0123456789abcdef-01';
		});

		expect(data).toMatchObject({
			__misskeyTraceContext: {
				traceparent: '00-0123456789abcdef0123456789abcdef-0123456789abcdef-01',
			},
		});
	});

	test('does not store an empty carrier when no active trace exists', () => {
		const data = { noteId: '9d6b9a65-46c9-4e1b-a640-9589693893c9' };

		injectQueueTraceContext(data, () => {});

		expect(data).not.toHaveProperty('__misskeyTraceContext');
	});

	test('ignores non-object job data', () => {
		const inject = vi.fn();

		injectQueueTraceContext(null, inject);
		injectQueueTraceContext('not a job object', inject);

		expect(inject).not.toHaveBeenCalled();
	});

	test('injects the active context with the configured propagator', () => {
		const activeContext = {} as Context;
		const carrier = {};
		const inject = vi.fn();

		injectActiveTraceContext({
			tracer: { startActiveSpan: vi.fn() } as any,
			propagation: { inject, extract: vi.fn() } as any,
			trace: { getSpanContext: vi.fn() },
			getActiveContext: () => activeContext,
			rootContext,
			mode: 'link',
			spanStatusCodeError: 2 as any,
		}, carrier);

		expect(inject).toHaveBeenCalledWith(activeContext, carrier);
	});

	test('starts a new root trace with a link by default', () => {
		const extract = vi.fn(() => extractedContext);
		const getSpanContext = vi.fn(() => sourceSpanContext);

		const result = getQueueSpanContext(jobData(), {
			rootContext,
			propagation: { inject: vi.fn(), extract },
			trace: { getSpanContext },
			mode: 'link',
		});

		expect(extract).toHaveBeenCalledWith(rootContext, jobData().__misskeyTraceContext);
		expect(result).toEqual({
			options: {
				root: true,
				links: [{ context: sourceSpanContext }],
			},
			parentContext: rootContext,
		});
		expect(result?.parentContext).toBe(rootContext);
		expect(getSpanContext).toHaveBeenCalledWith(extractedContext);
	});

	test('uses the extracted context as the parent when parent mode is selected', () => {
		const result = getQueueSpanContext(jobData(), {
			rootContext,
			propagation: { inject: vi.fn(), extract: () => extractedContext },
			trace: { getSpanContext: () => sourceSpanContext },
			mode: 'parent',
		});

		expect(result).toEqual({
			options: {},
			parentContext: extractedContext,
		});
		expect(result?.parentContext).toBe(extractedContext);
	});

	test('ignores malformed or missing carriers', () => {
		const extract = vi.fn(() => extractedContext);
		const deps = {
			rootContext,
			propagation: { inject: vi.fn(), extract },
			trace: { getSpanContext: () => sourceSpanContext },
			mode: 'link' as const,
		};

		expect(getQueueSpanContext({}, deps)).toBeUndefined();
		expect(getQueueSpanContext({ __misskeyTraceContext: { traceparent: 1 } }, deps)).toBeUndefined();
		expect(extract).not.toHaveBeenCalled();
	});

	test('defaults to link mode and rejects invalid configuration', () => {
		expect(getQueueTraceContextMode(undefined)).toBe('link');
		expect(getQueueTraceContextMode('parent')).toBe('parent');
		expect(() => getQueueTraceContextMode('children')).toThrow('otelForBackend.jobTraceContextMode');
	});

	test('executes synchronous work and ends the span once', () => {
		const span = { end: vi.fn(), recordException: vi.fn(), setStatus: vi.fn() };

		expect(executeSpan(span as any, () => 'ok', SpanStatusCode.ERROR)).toBe('ok');
		expect(span.end).toHaveBeenCalledOnce();
		expect(span.recordException).not.toHaveBeenCalled();
	});

	test('waits for resolved Promise work before ending the span', async () => {
		const span = { end: vi.fn(), recordException: vi.fn(), setStatus: vi.fn() };
		let resolveWork: ((value: string) => void) | undefined;
		const work = new Promise<string>(resolve => {
			resolveWork = resolve;
		});

		const result = executeSpan(span as any, () => work, SpanStatusCode.ERROR);
		expect(span.end).not.toHaveBeenCalled();

		if (resolveWork == null) throw new Error('work resolver was not initialized');
		resolveWork('ok');
		await expect(result).resolves.toBe('ok');
		expect(span.end).toHaveBeenCalledOnce();
		expect(span.recordException).not.toHaveBeenCalled();
	});

	test('records and propagates synchronous failures', () => {
		const span = { end: vi.fn(), recordException: vi.fn(), setStatus: vi.fn() };
		const error = new Error('boom');

		expect(() => executeSpan(span as any, () => { throw error; }, SpanStatusCode.ERROR)).toThrow(error);
		expect(span.recordException).toHaveBeenCalledWith(error);
		expect(span.setStatus).toHaveBeenCalledWith({ code: SpanStatusCode.ERROR, message: error.message });
		expect(span.end).toHaveBeenCalledOnce();
	});

	test('records and propagates rejected Promise work', async () => {
		const span = { end: vi.fn(), recordException: vi.fn(), setStatus: vi.fn() };
		const error = new Error('boom');

		await expect(executeSpan(span as any, () => Promise.reject(error), SpanStatusCode.ERROR)).rejects.toBe(error);
		expect(span.recordException).toHaveBeenCalledWith(error);
		expect(span.setStatus).toHaveBeenCalledWith({ code: SpanStatusCode.ERROR, message: error.message });
		expect(span.end).toHaveBeenCalledOnce();
	});

	test('normalizes non-Error failures before recording them', () => {
		const span = { recordException: vi.fn(), setStatus: vi.fn() };

		recordSpanError(span as any, 'boom', SpanStatusCode.ERROR);

		expect(span.recordException).toHaveBeenCalledWith(expect.any(Error));
		expect(span.recordException).toHaveBeenCalledWith(expect.objectContaining({ message: 'boom' }));
		expect(span.setStatus).toHaveBeenCalledWith({ code: SpanStatusCode.ERROR, message: 'boom' });
	});

	test('starts a span with the extracted queue context', () => {
		const span = { end: vi.fn(), recordException: vi.fn(), setStatus: vi.fn() };
		const startActiveSpan = vi.fn((_name: string, _options: unknown, _context: unknown, fn: (spanArg: typeof span) => string) => fn(span));
		const getSpanContext = vi.fn(() => sourceSpanContext);
		const deps = {
			tracer: { startActiveSpan } as any,
			rootContext,
			propagation: { inject: vi.fn(), extract: () => extractedContext } as any,
			trace: { getSpanContext },
			getActiveContext: () => rootContext,
			mode: 'link' as const,
			spanStatusCodeError: SpanStatusCode.ERROR,
		};

		expect(startSpanWithQueueTraceContext(deps, 'Queue: Deliver', jobData(), () => 'ok', () => 'fallback')).toBe('ok');
		expect(startActiveSpan).toHaveBeenCalledWith('Queue: Deliver', {
			root: true,
			links: [{ context: sourceSpanContext }],
		}, rootContext, expect.any(Function));
		expect(getSpanContext).toHaveBeenCalledOnce();
		expect(getSpanContext).toHaveBeenCalledWith(extractedContext);
		expect(span.end).toHaveBeenCalledOnce();
	});

	test('uses the fallback without starting a span when queue context is missing', () => {
		const startActiveSpan = vi.fn();
		const fallback = vi.fn(() => 'fallback');
		const deps = {
			tracer: { startActiveSpan } as any,
			rootContext,
			propagation: { inject: vi.fn(), extract: vi.fn() } as any,
			trace: { getSpanContext: vi.fn() },
			getActiveContext: () => rootContext,
			mode: 'link' as const,
			spanStatusCodeError: SpanStatusCode.ERROR,
		};

		expect(startSpanWithQueueTraceContext(deps, 'Queue: Deliver', {}, () => 'ok', fallback)).toBe('fallback');
		expect(fallback).toHaveBeenCalledOnce();
		expect(startActiveSpan).not.toHaveBeenCalled();
	});
});
