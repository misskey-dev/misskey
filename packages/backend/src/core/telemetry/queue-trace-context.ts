/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Context, PropagationAPI, Span, SpanContext, SpanOptions, SpanStatusCode, Tracer } from '@opentelemetry/api';

/** Redis 上のジョブデータにだけ保存する、OpenTelemetry propagator 用の carrier。 */
export type QueueTraceContextCarrier = Record<string, string>;
export type QueueTraceContextMode = 'link' | 'parent';

const QUEUE_TRACE_CONTEXT_KEY = '__misskeyTraceContext';

export type QueueTraceContextDeps = {
	tracer: Pick<Tracer, 'startActiveSpan'>;
	propagation: Pick<PropagationAPI, 'extract' | 'inject'>;
	trace: {
		getSpanContext(context: Context): SpanContext | undefined;
	};
	getActiveContext: () => Context;
	rootContext: Context;
	mode: QueueTraceContextMode;
	spanStatusCodeError: SpanStatusCode;
};

export type QueueSpanContext = {
	options: SpanOptions;
	parentContext: Context;
};

type QueueSpanContextDeps = Pick<QueueTraceContextDeps, 'propagation' | 'trace' | 'rootContext' | 'mode'>;

/**
 * enqueue 元の active context を、ジョブ本来のデータを壊さない内部フィールドとして保持する。
 * propagator が何も注入しなかった場合は、Redis に不要な空オブジェクトを残さない。
 */
export function injectQueueTraceContext(data: unknown, inject: (carrier: QueueTraceContextCarrier) => void): void {
	if (data == null || typeof data !== 'object') return;

	const carrier: QueueTraceContextCarrier = {};
	inject(carrier);

	if (Object.keys(carrier).length === 0) return;
	Object.assign(data, { [QUEUE_TRACE_CONTEXT_KEY]: carrier });
}

export function injectActiveTraceContext(deps: QueueTraceContextDeps, carrier: QueueTraceContextCarrier): void {
	deps.propagation.inject(deps.getActiveContext(), carrier);
}

/**
 * ジョブに保存された context から、worker span を作る際の親 context と options を組み立てる。
 * link モードは worker を新しい root trace として sampleRate を独立させ、元の span は Link として残す。
 */
export function getQueueSpanContext(data: unknown, deps: QueueSpanContextDeps): QueueSpanContext | undefined {
	const carrier = getQueueTraceContextCarrier(data);
	if (carrier == null) return undefined;

	const extractedContext = deps.propagation.extract(deps.rootContext, carrier);
	if (deps.mode === 'parent') {
		return {
			options: {},
			parentContext: extractedContext,
		};
	}

	const spanContext = deps.trace.getSpanContext(extractedContext);
	return {
		options: {
			root: true,
			...(spanContext != null ? { links: [{ context: spanContext }] } : {}),
		},
		parentContext: deps.rootContext,
	};
}

/**
 * context を持つ job は Link/parent の規則で span を開始し、持たない job は既存の adapter 固有実装へ委ねる。
 */
export function startSpanWithQueueTraceContext<T>(
	deps: QueueTraceContextDeps,
	name: string,
	jobData: object,
	fn: () => T,
	fallback: () => T,
): T {
	const spanContext = getQueueSpanContext(jobData, deps);
	if (spanContext == null) return fallback();

	return deps.tracer.startActiveSpan(name, spanContext.options, spanContext.parentContext, span => executeSpan(span, fn, deps.spanStatusCodeError));
}

/** 既存の TelemetryAdapter 契約に合わせ、同期・非同期のどちらでも span を処理完了時に閉じる。 */
export function executeSpan<T>(span: Span, fn: () => T, spanStatusCodeError: SpanStatusCode): T {
	try {
		const result = fn();
		if (isPromiseLike(result)) {
			return result.then(
				value => {
					span.end();
					return value;
				},
				error => {
					recordSpanError(span, error, spanStatusCodeError);
					span.end();
					throw error;
				},
			) as T;
		}

		span.end();
		return result;
	} catch (error) {
		recordSpanError(span, error, spanStatusCodeError);
		span.end();
		throw error;
	}
}

export function recordSpanError(span: Span, error: unknown, spanStatusCodeError: SpanStatusCode): void {
	const exception = error instanceof Error ? error : new Error(String(error));
	span.recordException(exception);
	span.setStatus({
		code: spanStatusCodeError,
		message: exception.message,
	});
}

export function getQueueTraceContextMode(mode: unknown): QueueTraceContextMode {
	if (mode == null || mode === 'link') return 'link';
	if (mode === 'parent') return 'parent';
	throw new Error('otelForBackend.jobTraceContextMode must be either \'link\' or \'parent\'.');
}

function getQueueTraceContextCarrier(data: unknown): QueueTraceContextCarrier | undefined {
	if (data == null || typeof data !== 'object') return undefined;
	const carrier = (data as Record<string, unknown>)[QUEUE_TRACE_CONTEXT_KEY];
	if (carrier == null || typeof carrier !== 'object' || Array.isArray(carrier)) return undefined;

	const entries = Object.entries(carrier);
	if (entries.length === 0 || entries.some(([, value]) => typeof value !== 'string')) return undefined;
	return Object.fromEntries(entries) as QueueTraceContextCarrier;
}

function isPromiseLike<T>(value: T): value is T & PromiseLike<Awaited<T>> {
	return value != null && typeof (value as { then?: unknown }).then === 'function';
}
