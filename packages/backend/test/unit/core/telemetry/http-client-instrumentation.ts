/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test, vi } from 'vitest';
import { SpanKind, SpanStatusCode } from '@opentelemetry/api';
import { createHttpClientInstrumentation } from '@/core/telemetry/http-client-instrumentation.js';

function request() {
	return {
		method: 'POST',
		protocol: 'https:',
		path: '/inbox?token=secret',
		host: 'remote.example',
		getHeader: vi.fn((name: string) => name === 'host' ? 'user:password@remote.example:8443' : undefined),
	};
}

describe('http-client-instrumentation', () => {
	test('creates and completes a sanitized CLIENT span from diagnostics channels', () => {
		const listeners = new Map<string, (message: unknown) => void>();
		const span = {
			end: vi.fn(),
			recordException: vi.fn(),
			setAttribute: vi.fn(),
			setStatus: vi.fn(),
		};
		const tracer = { startSpan: vi.fn(() => span) } as any;
		const unsubscribe = createHttpClientInstrumentation({
			tracer,
			spanKindClient: SpanKind.CLIENT,
			spanStatusCodeError: SpanStatusCode.ERROR,
			subscribe: (name, listener) => {
				listeners.set(name, listener);
				return () => listeners.delete(name);
			},
		});
		const clientRequest = request();

		listeners.get('http.client.request.created')!({ request: clientRequest });
		listeners.get('http.client.response.finish')!({
			request: clientRequest,
			response: { statusCode: 201, httpVersion: '1.1' },
		});

		expect(tracer.startSpan).toHaveBeenCalledWith('POST', {
			kind: SpanKind.CLIENT,
			attributes: {
				'http.request.method': 'POST',
				'url.full': 'https://remote.example:8443/inbox',
				'server.address': 'remote.example',
				'server.port': 8443,
			},
		});
		expect(span.setAttribute).toHaveBeenCalledWith('http.response.status_code', 201);
		expect(span.setAttribute).toHaveBeenCalledWith('network.protocol.version', '1.1');
		expect(span.end).toHaveBeenCalledTimes(1);
		unsubscribe();
		expect(listeners).toHaveLength(0);
	});

	test('records a request error and ends the span once', () => {
		const listeners = new Map<string, (message: unknown) => void>();
		const span = { end: vi.fn(), recordException: vi.fn(), setAttribute: vi.fn(), setStatus: vi.fn() };
		const error = Object.assign(new Error('connection refused'), { code: 'ECONNREFUSED' });
		const clientRequest = request();
		createHttpClientInstrumentation({
			tracer: { startSpan: vi.fn(() => span) } as any,
			spanKindClient: SpanKind.CLIENT,
			spanStatusCodeError: SpanStatusCode.ERROR,
			subscribe: (name, listener) => {
				listeners.set(name, listener);
				return () => listeners.delete(name);
			},
		});

		listeners.get('http.client.request.created')!({ request: clientRequest });
		listeners.get('http.client.request.error')!({ request: clientRequest, error });
		listeners.get('http.client.response.finish')!({ request: clientRequest, response: { statusCode: 200 } });

		expect(span.recordException).toHaveBeenCalledWith(error);
		expect(span.setAttribute).toHaveBeenCalledWith('error.type', 'ECONNREFUSED');
		expect(span.setStatus).toHaveBeenCalledWith({ code: SpanStatusCode.ERROR });
		expect(span.end).toHaveBeenCalledTimes(1);
	});

	test('records the response status code as error.type for an error response', () => {
		const listeners = new Map<string, (message: unknown) => void>();
		const span = { end: vi.fn(), recordException: vi.fn(), setAttribute: vi.fn(), setStatus: vi.fn() };
		const clientRequest = request();
		createHttpClientInstrumentation({
			tracer: { startSpan: vi.fn(() => span) } as any,
			spanKindClient: SpanKind.CLIENT,
			spanStatusCodeError: SpanStatusCode.ERROR,
			subscribe: (name, listener) => {
				listeners.set(name, listener);
				return () => listeners.delete(name);
			},
		});

		listeners.get('http.client.request.created')!({ request: clientRequest });
		listeners.get('http.client.response.finish')!({ request: clientRequest, response: { statusCode: 502 } });

		expect(span.setAttribute).toHaveBeenCalledWith('error.type', '502');
		expect(span.setStatus).toHaveBeenCalledWith({ code: SpanStatusCode.ERROR });
	});
});
