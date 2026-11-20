/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { EventEmitter } from 'node:events';
import { describe, expect, test, vi } from 'vitest';
import { SpanKind, SpanStatusCode } from '@opentelemetry/api';
import { createHttpClientInstrumentation } from '@/core/telemetry/http-client-instrumentation.js';

function request() {
	return Object.assign(new EventEmitter(), {
		method: 'POST',
		protocol: 'https:',
		path: '/inbox?token=secret',
		host: 'remote.example',
		getHeader: vi.fn((name: string) => name === 'host' ? 'user:password@remote.example:8443' : undefined),
	});
}

function response(fields: { statusCode?: number; httpVersion?: string; complete?: boolean }) {
	return Object.assign(new EventEmitter(), { complete: true, ...fields });
}

function setup(span: unknown) {
	const listeners = new Map<string, (message: unknown) => void>();
	const tracer = { startSpan: vi.fn(() => span) };
	createHttpClientInstrumentation({
		tracer: tracer as any,
		spanKindClient: SpanKind.CLIENT,
		spanStatusCodeError: SpanStatusCode.ERROR,
		subscribe: (name, listener) => {
			listeners.set(name, listener);
			return () => listeners.delete(name);
		},
	});
	return { listeners, tracer };
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
		const clientResponse = response({ statusCode: 201, httpVersion: '1.1' });

		listeners.get('http.client.request.created')!({ request: clientRequest });
		listeners.get('http.client.response.finish')!({
			request: clientRequest,
			response: clientResponse,
		});
		// response finish はヘッダー受信時点なので、本文が終わるまで span は閉じない。
		expect(span.end).not.toHaveBeenCalled();
		clientResponse.emit('close');
		clientRequest.emit('close');

		expect(tracer.startSpan).toHaveBeenCalledWith('POST', {
			kind: SpanKind.CLIENT,
			attributes: {
				'http.request.method': 'POST',
				'url.full': 'https://remote.example:8443/',
				'server.address': 'remote.example',
				'server.port': 8443,
			},
		});
		expect(span.setAttribute).toHaveBeenCalledWith('http.response.status_code', 201);
		expect(span.setAttribute).toHaveBeenCalledWith('network.protocol.version', '1.1');
		expect(span.end).toHaveBeenCalledTimes(1);
		unsubscribe();
		expect(listeners.size).toBe(0);
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
		listeners.get('http.client.response.finish')!({ request: clientRequest, response: response({ statusCode: 200 }) });
		clientRequest.emit('close');

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
		listeners.get('http.client.response.finish')!({ request: clientRequest, response: response({ statusCode: 502 }) });

		expect(span.setAttribute).toHaveBeenCalledWith('error.type', '502');
		expect(span.setStatus).toHaveBeenCalledWith({ code: SpanStatusCode.ERROR });
	});

	test('marks the span as an error when the response body is aborted', () => {
		const span = { end: vi.fn(), recordException: vi.fn(), setAttribute: vi.fn(), setStatus: vi.fn() };
		const { listeners } = setup(span);
		const clientRequest = request();
		const clientResponse = response({ statusCode: 200, complete: false });

		listeners.get('http.client.request.created')!({ request: clientRequest });
		listeners.get('http.client.response.finish')!({ request: clientRequest, response: clientResponse });
		clientResponse.emit('close');

		expect(span.setAttribute).toHaveBeenCalledWith('error.type', 'aborted');
		expect(span.setStatus).toHaveBeenCalledWith({ code: SpanStatusCode.ERROR });
		expect(span.end).toHaveBeenCalledTimes(1);
	});

	test('ends the span on request close when no response finish is published (CONNECT / Upgrade)', () => {
		const span = { end: vi.fn(), recordException: vi.fn(), setAttribute: vi.fn(), setStatus: vi.fn() };
		const { listeners } = setup(span);
		const clientRequest = request();

		listeners.get('http.client.request.created')!({ request: clientRequest });
		clientRequest.emit('close');

		expect(span.setStatus).not.toHaveBeenCalled();
		expect(span.end).toHaveBeenCalledTimes(1);
	});

	test('does not derive the host from a request path starting with //', () => {
		const span = { end: vi.fn(), recordException: vi.fn(), setAttribute: vi.fn(), setStatus: vi.fn() };
		const { listeners, tracer } = setup(span);
		const clientRequest = Object.assign(request(), { path: '//attacker.example/secret' });

		listeners.get('http.client.request.created')!({ request: clientRequest });

		expect(tracer.startSpan).toHaveBeenCalledWith('POST', expect.objectContaining({
			attributes: expect.objectContaining({
				'url.full': 'https://remote.example:8443/',
				'server.address': 'remote.example',
			}),
		}));
	});

	test('uses safe request details when the request URL cannot be constructed', () => {
		const listeners = new Map<string, (message: unknown) => void>();
		const span = { end: vi.fn(), recordException: vi.fn(), setAttribute: vi.fn(), setStatus: vi.fn() };
		const tracer = { startSpan: vi.fn(() => span) };
		createHttpClientInstrumentation({
			tracer: tracer as any,
			spanKindClient: SpanKind.CLIENT,
			spanStatusCodeError: SpanStatusCode.ERROR,
			subscribe: (name, listener) => {
				listeners.set(name, listener);
				return () => listeners.delete(name);
			},
		});
		const clientRequest = {
			...request(),
			host: '::1',
			getHeader: vi.fn(() => undefined),
		};

		listeners.get('http.client.request.created')!({ request: clientRequest });

		expect(tracer.startSpan).toHaveBeenCalledWith('POST', {
			kind: SpanKind.CLIENT,
			attributes: {
				'http.request.method': 'POST',
				'url.full': 'https://localhost/',
				'server.address': 'localhost',
				'server.port': 443,
			},
		});
	});

	test('does not propagate errors from diagnostics listeners', () => {
		const listeners = new Map<string, (message: unknown) => void>();
		const reportError = vi.fn();
		const responseError = new Error('response instrumentation failed');
		const requestError = new Error('request instrumentation failed');
		const startError = new Error('span creation failed');
		const span = {
			end: vi.fn(),
			recordException: vi.fn(() => { throw requestError; }),
			setAttribute: vi.fn(() => { throw responseError; }),
			setStatus: vi.fn(),
		};
		const tracer = {
			startSpan: vi.fn()
				.mockReturnValueOnce(span)
				.mockReturnValueOnce(span)
				.mockImplementationOnce(() => { throw startError; }),
		};
		createHttpClientInstrumentation({
			tracer: tracer as any,
			spanKindClient: SpanKind.CLIENT,
			spanStatusCodeError: SpanStatusCode.ERROR,
			subscribe: (name, listener) => {
				listeners.set(name, listener);
				return () => listeners.delete(name);
			},
			reportError,
		});
		const responseRequest = request();
		const errorRequest = request();

		listeners.get('http.client.request.created')!({ request: responseRequest });
		expect(() => listeners.get('http.client.response.finish')!({
			request: responseRequest,
			response: response({ statusCode: 200 }),
		})).not.toThrow();
		listeners.get('http.client.request.created')!({ request: errorRequest });
		expect(() => listeners.get('http.client.request.error')!({
			request: errorRequest,
			error: new Error('connection failed'),
		})).not.toThrow();
		expect(() => listeners.get('http.client.request.created')!({ request: request() })).not.toThrow();

		expect(reportError).toHaveBeenCalledWith(responseError);
		expect(reportError).toHaveBeenCalledWith(requestError);
		expect(reportError).toHaveBeenCalledWith(startError);
	});
});
