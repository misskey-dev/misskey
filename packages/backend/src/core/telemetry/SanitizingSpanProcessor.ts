/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { sanitizeAttributes } from '@/core/telemetry/sanitizer/attributes.js';
import type { SanitizeAttributesOptions } from '@/core/telemetry/sanitizer/attributes.js';
import { exceptionMessageMaxBytes, exceptionStacktraceMaxBytes, stripLogInjectionControlChars, truncateUtf8Bytes } from '@/core/telemetry/sanitizer/text.js';
import { isSpanId, isTraceId, isWithinObservabilityLimit, marker } from '@/core/telemetry/sanitizer/validation.js';
import type { Context, Link, SpanContext } from '@opentelemetry/api';
import type { ReadableSpan, SpanProcessor, TimedEvent } from '@opentelemetry/sdk-trace-base';

// export先での表示・調査に必要な最小限に留め、1 span あたりの上限を明示する。
const maxLinks = 8;
const maxEvents = 4;
const spanNameMaxBytes = 256;

/**
 * 計測情報を送信先へ渡す直前に、公開してよい値だけを持つ複製へ置き換える。
 * 元の計測情報には後から属性が追加されうるため、下流へそのまま渡さない。
 *
 * span はすべて Misskey の OTel provider から出るため、送信先 (otelForBackend の endpoint と
 * Sentry の OTLP endpoint) ごとの BatchSpanProcessor をそれぞれこの processor で包む。
 */
export class SanitizingSpanProcessor implements SpanProcessor {
	public constructor(
		private readonly downstream: SpanProcessor,
		private readonly policy: SanitizeAttributesOptions = {},
	) {
	}

	/** 終了時に安全な複製を作るため、開始時の span は下流へ渡さない。 */
	public onStart(_span: Parameters<SpanProcessor['onStart']>[0], _parentContext: Context): void {
	}

	/**
	 * 終了した計測情報を確認し、公開可能な複製だけを下流へ渡す。
	 * 途中で失敗しても元の計測情報を送らず、情報漏えいを防ぐ。
	 */
	public onEnd(span: ReadableSpan): void {
		try {
			const safe = createSanitizedReadableSpan(span, this.policy);
			if (safe != null) {
				this.downstream.onEnd(safe);
			}
		} catch {
			// 加工や下流処理に失敗しても、未加工の span は送らない。
		}
	}

	/**
	 * 下流に溜まった送信待ちの計測情報を送る。
	 * 下流の失敗で終了処理全体を止めないよう、同期の throw と Promise の reject の両方を吸収する。
	 * 失敗の内容は OTel の diag logger 経由で報告されるため、ここでは再送も記録もしない。
	 */
	public forceFlush(): Promise<void> {
		try {
			return Promise.resolve(this.downstream.forceFlush()).catch(() => undefined);
		} catch {
			return Promise.resolve();
		}
	}

	/**
	 * 下流の送信処理を終了する。
	 * 監視用の送信失敗によってアプリケーションの終了を妨げないよう、
	 * `forceFlush` と同じく同期の throw と Promise の reject の両方を吸収する。
	 */
	public shutdown(): Promise<void> {
		try {
			return Promise.resolve(this.downstream.shutdown()).catch(() => undefined);
		} catch {
			return Promise.resolve();
		}
	}
}

/**
 * 元の計測情報から、公開を許可した項目だけを含む読み取り用の複製を作る。
 * 形式が不正、または大きさの制限を超える場合は出力せず、未加工の情報も返さない。
 *
 * resource と instrumentationScope は運用者の設定と計装ライブラリが起動時に決める値なので、元のオブジェクトをそのまま渡す。
 * OTLP exporter は resource をオブジェクトの同一性でまとめるため、span ごとに作り直すとバッチが resource 単位に分割されてしまう。
 */
export function createSanitizedReadableSpan(span: ReadableSpan, policy: SanitizeAttributesOptions = {}): ReadableSpan | undefined {
	try {
		const context = span.spanContext();
		if (!isTraceId(context.traceId) || !isSpanId(context.spanId)) {
			return undefined;
		}
		const spanContext: SpanContext = { traceId: context.traceId, spanId: context.spanId, traceFlags: context.traceFlags, isRemote: context.isRemote };

		const attributes = sanitizeAttributes(span.attributes, policy);
		const name = sanitizeSpanName(span.name, attributes);
		const parentSpanContext = sanitizeParentSpanContext(span.parentSpanContext, context.traceId);
		const events = sanitizeEvents(span.events);
		const links = sanitizeLinks(span.links);
		// status.message は例外メッセージなど自由記述を含みうるため、code だけを残す。
		const status = { code: span.status.code };

		// event の個別上限は生の UTF-8 バイト数で測るため、JSON 化時のエスケープで全体上限を超えうる。
		// 超過時は event から減らし、span 名や status をできるだけ残す。
		const measure = (): unknown => ({ name, attributes, status, parentSpanContext, events, links });
		while (!isWithinObservabilityLimit(measure()) && events.length > 0) {
			events.pop();
		}
		if (!isWithinObservabilityLimit(measure())) {
			return undefined;
		}

		// SDK とこの処理が破棄した event の合計を、OTLP の uint32 上限内で報告する。
		const originalEventCount = Array.isArray(span.events) ? span.events.length : 0;
		const alreadyDropped = Number.isInteger(span.droppedEventsCount) && span.droppedEventsCount >= 0 ? span.droppedEventsCount : 0;

		return {
			name,
			kind: span.kind,
			spanContext: () => spanContext,
			parentSpanContext,
			startTime: span.startTime,
			endTime: span.endTime,
			status,
			attributes,
			links,
			events,
			duration: span.duration,
			ended: true,
			resource: span.resource,
			instrumentationScope: span.instrumentationScope,
			droppedAttributesCount: 0,
			droppedEventsCount: Math.min(0xffff_ffff, alreadyDropped + Math.max(0, originalEventCount - events.length)),
			droppedLinksCount: 0,
		};
	} catch {
		// 加工できない情報は出力しない。元の情報を返す経路を作らないためである。
		return undefined;
	}
}

/**
 * span 名を決める。
 *
 * HTTP の span は、計装が付けた名前に生の path が含まれうるため使わず、許可済みの属性から作り直す。
 * 受信 span は method と route、送信 span は method と `url.full` の host を使う。
 * それ以外の span 名は Misskey 自身と計装ライブラリがコード上で決める (`API: notes/create`、`pg.query:SELECT` など) ため、
 * 表示を操作する制御文字を除き、長さを制限するだけにする。
 */
function sanitizeSpanName(value: unknown, attributes: Record<string, string | number | boolean>): string {
	const method = attributes['http.request.method'];
	if (typeof method === 'string') {
		// Fastify の hook span も http.route を持つが、method を持たないためここには来ない。
		const route = attributes['http.route'];
		if (typeof route === 'string') {
			return `${method} ${route}`;
		}
		const url = attributes['url.full'];
		if (typeof url === 'string') {
			return `${method} ${new URL(url).host}`;
		}
	}

	if (typeof value !== 'string') {
		return marker;
	}
	const name = truncateUtf8Bytes(stripLogInjectionControlChars(value), spanNameMaxBytes);
	return name === '' ? marker : name;
}

/**
 * 親の追跡情報から、子と同じ追跡単位に属する安全な項目だけを残す。
 *
 * 余分な状態や別の追跡単位を持ち込まないため、必要な四つの値を作り直す。
 */
function sanitizeParentSpanContext(value: unknown, traceId: string): SpanContext | undefined {
	if (value == null || typeof value !== 'object') {
		return undefined;
	}
	const parent = value as Record<string, unknown>;
	if (parent.traceId !== traceId || !isSpanId(parent.spanId)) {
		return undefined;
	}
	return {
		traceId,
		spanId: parent.spanId,
		// sampled ビットだけを残し、未知または未設定のフラグは安全側 (0) に丸める。
		traceFlags: parent.traceFlags === 1 ? 1 : 0,
		isRemote: parent.isRemote === true,
	};
}

/**
 * span link を、追跡単位の識別子だけを持つ最小構成へ作り直す。
 *
 * jobTraceContextMode: 'link' では自 span とは別の trace を指すのが正常な使い方なので、
 * traceId の一致は求めず形式だけを確認する。attributes や traceState は利用者情報を含みうるため引き継がない。
 */
function sanitizeLinks(value: unknown): Link[] {
	if (!Array.isArray(value)) {
		return [];
	}
	const links: Link[] = [];
	for (const link of value.slice(0, maxLinks)) {
		const context = (link as { context?: unknown } | null)?.context as Record<string, unknown> | undefined;
		if (context == null || !isTraceId(context.traceId) || !isSpanId(context.spanId)) {
			continue;
		}
		links.push({ context: {
			traceId: context.traceId,
			spanId: context.spanId,
			traceFlags: context.traceFlags === 1 ? 1 : 0,
			isRemote: context.isRemote === true,
		} });
	}
	return links;
}

/**
 * span event から、例外の種類・メッセージ・スタックトレースを残す。
 *
 * `exception.message` と `exception.stacktrace` は形式検証できない自由記述だが、OTLP での調査に必要なため意図して残す。
 * 自由記述の値から表示を操作する制御文字を除き、個別の上限まで切り詰める。
 * JSON 化後に全体上限を超えた場合は、`createSanitizedReadableSpan` が event 数を減らす。
 */
function sanitizeEvents(value: unknown): TimedEvent[] {
	if (!Array.isArray(value)) {
		return [];
	}
	const events: TimedEvent[] = [];
	for (const event of value) {
		const source = event as Partial<TimedEvent> | null;
		if (source?.name !== 'exception' || source.time == null) {
			continue;
		}
		// 属性名は 'error.type' の許可規則を借りて値を確認し、公開する属性名は semconv 通りの 'exception.type' に戻す。
		const type = sanitizeAttributes({ 'error.type': source.attributes?.['exception.type'] })['error.type'];
		const attributes: Record<string, string> = {};
		if (typeof type === 'string') {
			attributes['exception.type'] = type;
		}
		const message = source.attributes?.['exception.message'];
		if (typeof message === 'string') {
			attributes['exception.message'] = truncateUtf8Bytes(stripLogInjectionControlChars(message), exceptionMessageMaxBytes);
		}
		const stacktrace = source.attributes?.['exception.stacktrace'];
		if (typeof stacktrace === 'string') {
			attributes['exception.stacktrace'] = truncateUtf8Bytes(stripLogInjectionControlChars(stacktrace), exceptionStacktraceMaxBytes);
		}
		events.push({
			name: 'exception',
			time: source.time,
			droppedAttributesCount: 0,
			attributes,
		});
		if (events.length >= maxEvents) {
			break;
		}
	}
	return events;
}
