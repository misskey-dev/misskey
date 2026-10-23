/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Context, PropagationAPI, Span, SpanContext, SpanOptions, SpanStatusCode, Tracer } from '@opentelemetry/api';

/*
 * enqueue (push) から worker による取得・処理 (pop) までをテレメトリ上で関連付け、
 * Queue を挟む非同期処理を一連の流れとして追跡できるようにする。
 * そのため、trace context を次の流れで伝播する:
 *
 * 1. producer 側で active context を W3C Trace Context 形式の carrier へ注入する。
 * 2. carrier をジョブデータの内部フィールドに保存し、BullMQ/Redis 経由で worker へ渡す。
 * 3. worker 側で carrier を context へ戻し、設定に応じて Link または parent に使う。
 *
 * OTel API への依存を引数にしているのは、OTel 単体構成と Sentry + OTLP 構成で
 * 同じ伝播処理を使うため。
 */
/** Redis 上のジョブデータにだけ保存する、OpenTelemetry propagator 用の carrier。 */
export type QueueTraceContextCarrier = Record<string, string>;
export type QueueTraceContextMode = 'link' | 'parent';

// 通常のジョブプロセッサが参照しない Misskey 内部フィールドとして、ユーザー定義の data と区別する。
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
	// BullMQ の型定義外から渡される値も考慮し、書き込めない値は無視する。
	if (data == null || typeof data !== 'object') return;

	const carrier: QueueTraceContextCarrier = {};
	inject(carrier);

	// active span が無い場合、propagator は何も注入しない。空の内部フィールドは Redis に保存しない。
	if (Object.keys(carrier).length === 0) return;
	Object.assign(data, { [QUEUE_TRACE_CONTEXT_KEY]: carrier });
}

/** 現在実行中の span を propagator の標準形式で carrier へ書き出す。 */
export function injectActiveTraceContext(deps: QueueTraceContextDeps, carrier: QueueTraceContextCarrier): void {
	deps.propagation.inject(deps.getActiveContext(), carrier);
}

/**
 * ジョブに保存された carrier から、worker span の開始に必要な context と options を組み立てる。
 *
 * - parent: enqueue span の子として同じ trace を継続する。
 * - link: worker span を別の root trace にし、enqueue span への関連だけを Link に残す。
 *
 * link モードで trace を分けることで、worker 側の sampling 判定を enqueue 側から独立させられる。
 */
export function getQueueSpanContext(data: unknown, deps: QueueSpanContextDeps): QueueSpanContext | undefined {
	const carrier = getQueueTraceContextCarrier(data);
	if (carrier == null) return undefined;

	// Redis から復元した carrier は別プロセス由来なので、現在の context ではなく ROOT_CONTEXT から展開する。
	const extractedContext = deps.propagation.extract(deps.rootContext, carrier);
	if (deps.mode === 'parent') {
		return {
			options: {},
			parentContext: extractedContext,
		};
	}

	// Link が受け取るのは Context ではなく SpanContext なので、extract 後に取り出す。
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
 * context を持つジョブは Link/parent の規則で span を開始する。
 * デプロイ前に enqueue されたジョブなど、context を持たない場合は既存の adapter 固有実装へ委ねる。
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

/**
 * 既存の TelemetryAdapter 契約に合わせ、同期値と Promise のどちらを返す処理も span で包む。
 * 成功・失敗のどちらでも処理完了まで span を開き、必ず一度だけ閉じる。
 */
export function executeSpan<T>(span: Span, fn: () => T, spanStatusCodeError: SpanStatusCode): T {
	try {
		const result = fn();
		if (isPromiseLike(result)) {
			// fn() の戻り値は T のまま保ちつつ、Promise の settle 時に span を閉じる。
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
		// fn() が同期的に throw した場合も、Promise の reject と同じ形で記録して呼び出し元へ戻す。
		recordSpanError(span, error, spanStatusCodeError);
		span.end();
		throw error;
	}
}

/** Error 以外の throw 値も OTel exporter が扱える例外に正規化し、span をエラー状態にする。 */
export function recordSpanError(span: Span, error: unknown, spanStatusCodeError: SpanStatusCode): void {
	const exception = error instanceof Error ? error : new Error(String(error));
	span.recordException(exception);
	span.setStatus({
		code: spanStatusCodeError,
		message: exception.message,
	});
}

/**
 * 未設定時は、enqueue と worker の sampling を分離できる link を使う。
 * 設定ミスを無言でフォールバックさせないため、未知の値は起動時にエラーにする。
 */
export function getQueueTraceContextMode(mode: unknown): QueueTraceContextMode {
	if (mode == null || mode === 'link') return 'link';
	if (mode === 'parent') return 'parent';
	throw new Error('otelForBackend.jobTraceContextMode must be either \'link\' or \'parent\'.');
}

function getQueueTraceContextCarrier(data: unknown): QueueTraceContextCarrier | undefined {
	if (data == null || typeof data !== 'object') return undefined;
	const carrier = (data as Record<string, unknown>)[QUEUE_TRACE_CONTEXT_KEY];
	if (carrier == null || typeof carrier !== 'object' || Array.isArray(carrier)) return undefined;

	// Redis 上の旧いジョブや壊れたデータで worker を落とさないよう、propagator に渡せる string map だけを受け入れる。
	const entries = Object.entries(carrier);
	if (entries.length === 0 || entries.some(([, value]) => typeof value !== 'string')) return undefined;
	return Object.fromEntries(entries) as QueueTraceContextCarrier;
}

function isPromiseLike<T>(value: T): value is T & PromiseLike<Awaited<T>> {
	// native Promise に限らず thenable も span の完了を待てるよう、instanceof ではなく then の有無で判定する。
	return value != null && typeof (value as { then?: unknown }).then === 'function';
}
