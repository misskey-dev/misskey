/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test, vi } from 'vitest';
import type { Context, SpanContext } from '@opentelemetry/api';
import { getQueueSpanContext, getQueueTraceContextMode, injectActiveTraceContext, injectQueueTraceContext } from '@/core/telemetry/queue-trace-context.js';

const rootContext = {} as Context;
const extractedContext = {} as Context;
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
});
