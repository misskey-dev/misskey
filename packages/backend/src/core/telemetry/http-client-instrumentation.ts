/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { channel } from 'node:diagnostics_channel';
import { diag } from '@opentelemetry/api';
import type { ClientRequest, IncomingMessage } from 'node:http';
import type { Span, SpanOptions, SpanStatusCode, Tracer } from '@opentelemetry/api';

const HTTP_CLIENT_REQUEST_CREATED = 'http.client.request.created';
const HTTP_CLIENT_RESPONSE_FINISH = 'http.client.response.finish';
const HTTP_CLIENT_REQUEST_ERROR = 'http.client.request.error';

type HttpClientSpan = Pick<Span, 'end' | 'recordException' | 'setAttribute' | 'setStatus'>;

type HttpClientInstrumentationDeps = {
	tracer: Pick<Tracer, 'startSpan'>;
	spanKindClient: SpanOptions['kind'];
	spanStatusCodeError: SpanStatusCode;
	subscribe: (name: string, listener: (message: unknown) => void) => () => void;
	reportError?: (error: unknown) => void;
};

type RequestCreatedMessage = { request: ClientRequest };
type ResponseFinishMessage = { request: ClientRequest; response: IncomingMessage };
type RequestErrorMessage = { request: ClientRequest; error: Error };

/**
 * require フックを使わず、Node.js 組み込み HTTP クライアントの diagnostics channel を計装する。
 * telemetry 初期化前に読み込まれたモジュールも対象になる。
 */
export function createHttpClientInstrumentation(deps: HttpClientInstrumentationDeps): () => void {
	const spans = new WeakMap<ClientRequest, HttpClientSpan>();

	const unsubscribeCreated = deps.subscribe(HTTP_CLIENT_REQUEST_CREATED, guardDiagnosticsListener(deps, (message: unknown) => {
		const { request } = message as RequestCreatedMessage;
		const { url, host, port } = getRequestDetails(request);
		const method = request.method;
		const span = deps.tracer.startSpan(method, {
			kind: deps.spanKindClient,
			attributes: {
				'http.request.method': method,
				'url.full': url,
				'server.address': host,
				'server.port': port,
			},
		});
		spans.set(request, span);
	}));

	const unsubscribeResponseFinish = deps.subscribe(HTTP_CLIENT_RESPONSE_FINISH, guardDiagnosticsListener(deps, (message: unknown) => {
		const { request, response } = message as ResponseFinishMessage;
		const span = spans.get(request);
		if (span == null) return;

		const statusCode = response.statusCode;
		if (statusCode != null) {
			span.setAttribute('http.response.status_code', statusCode);
		}
		span.setAttribute('network.protocol.version', response.httpVersion);
		if (statusCode != null && statusCode >= 400) {
			span.setAttribute('error.type', String(statusCode));
			span.setStatus({ code: deps.spanStatusCodeError });
		}
		span.end();
		spans.delete(request);
	}));

	const unsubscribeRequestError = deps.subscribe(HTTP_CLIENT_REQUEST_ERROR, guardDiagnosticsListener(deps, (message: unknown) => {
		const { request, error } = message as RequestErrorMessage;
		const span = spans.get(request);
		if (span == null) return;

		span.recordException(error);
		span.setAttribute('error.type', getErrorType(error));
		span.setStatus({ code: deps.spanStatusCodeError });
		span.end();
		spans.delete(request);
	}));

	return () => {
		unsubscribeCreated();
		unsubscribeResponseFinish();
		unsubscribeRequestError();
	};
}

export function installHttpClientInstrumentation(deps: Omit<HttpClientInstrumentationDeps, 'subscribe'>): () => void {
	return createHttpClientInstrumentation({
		...deps,
		reportError: deps.reportError ?? (error => diag.error('Failed to process HTTP client diagnostics event.', error)),
		subscribe: (name, listener) => {
			const diagnosticChannel = channel(name);
			diagnosticChannel.subscribe(listener);
			return () => diagnosticChannel.unsubscribe(listener);
		},
	});
}

function getRequestDetails(request: ClientRequest): { url: string; host: string; port: number } {
	let protocol: 'http:' | 'https:' = 'http:';

	try {
		protocol = request.protocol === 'https:' ? 'https:' : 'http:';
		const host = request.getHeader('host')?.toString() ?? request.host;
		const url = new URL(request.path || '/', `${protocol}//${host}`);
		// URL 属性には認証情報やクエリ文字列を含めない。
		url.username = '';
		url.password = '';
		url.search = '';
		url.hash = '';

		return {
			url: url.toString(),
			host: url.hostname,
			// URL.port は既定ポートでは空文字列になるため、スキームから補う。
			port: url.port === '' ? (url.protocol === 'https:' ? 443 : 80) : Number(url.port),
		};
	} catch {
		return {
			url: `${protocol}//localhost/`,
			host: 'localhost',
			port: protocol === 'https:' ? 443 : 80,
		};
	}
}

function guardDiagnosticsListener(
	deps: Pick<HttpClientInstrumentationDeps, 'reportError'>,
	listener: (message: unknown) => void,
): (message: unknown) => void {
	return (message) => {
		try {
			listener(message);
		} catch (error) {
			try {
				deps.reportError?.(error);
			} catch {
				// diagnostics listener の失敗をアプリケーションへ伝播させない。
			}
		}
	};
}

function getErrorType(error: Error): string {
	// Node.js の system error code は安定した低カーディナリティの識別子になる。
	const code = (error as NodeJS.ErrnoException).code;
	return code ?? error.name;
}
