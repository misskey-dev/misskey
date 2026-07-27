/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { sanitizeAttributes, sanitizeResourceAttributes } from '@/core/telemetry/sanitizer/attributes.js';
import type { SanitizeAttributesOptions } from '@/core/telemetry/sanitizer/attributes.js';
import { fastifyHookOps, pgQueryNamePattern, redisCommandNamePattern, safeName } from '@/core/telemetry/sanitizer/span-name.js';
import { exceptionMessageMaxBytes, exceptionStacktraceMaxBytes, stripLogInjectionControlChars, truncateUtf8Bytes } from '@/core/telemetry/sanitizer/text.js';
import { isSpanId, isTraceId, isWithinObservabilityLimit, marker } from '@/core/telemetry/sanitizer/validation.js';
import type { Context } from '@opentelemetry/api';
import type { ReadableSpan, SpanProcessor } from '@opentelemetry/sdk-trace-base';

type Scope = { name?: string } | undefined;
type CombinedScopeCaptureOptions = {
	capturePgSpans: boolean;
	capturePgConnectionSpans: boolean;
	captureRedisCommandSpans: boolean;
	captureRedisConnectionSpans: boolean;
	captureRedisRootSpans: boolean;
};

/** Sentry と併用するときに、追加で出力を許可する自動計測の設定。 */
const noCombinedScopeCapture: CombinedScopeCaptureOptions = {
	capturePgSpans: false,
	capturePgConnectionSpans: false,
	captureRedisCommandSpans: false,
	captureRedisConnectionSpans: false,
	captureRedisRootSpans: false,
};

/**
 * 計測情報を送信先へ渡す直前に、公開してよい値だけを持つ複製へ置き換える。
 * 元の計測情報には後から属性が追加されうるため、下流へそのまま渡さない。
 */
export class SanitizingSpanProcessor implements SpanProcessor {
	/**
	 * 下流の processor へ渡す span を、出力可否と属性ポリシーに従って制限する。
	 *
	 * 属性の許可範囲を広げる policy は、下流が OTLP exporter を包む場合に限って指定する。
	 * 特に `allowDbStatement: true` は OTLP span だけを対象とし、Sentry 自身の計装と送信には適用しない。
	 */
	public constructor(
		private readonly downstream: SpanProcessor,
		private readonly shouldExport: (scope: Scope, span: ReadableSpan) => boolean = () => true,
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
			const scope = getScope(span);
			if (!this.shouldExport(scope, span)) {
				return;
			}

			const safe = createSanitizedReadableSpan(span, scope, this.policy);
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
	public forceFlush(): ReturnType<SpanProcessor['forceFlush']> {
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
	public shutdown(): ReturnType<SpanProcessor['shutdown']> {
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
 * OTLP 経路以外から呼ぶ場合は policy を既定値のままにし、SQL 本文などを追加で許可しないこと。
 */
export function createSanitizedReadableSpan(span: ReadableSpan, scope = getScope(span), policy: SanitizeAttributesOptions = {}): ReadableSpan | undefined {
	try {
		const attributes = sanitizeAttributes(span.attributes, policy);
		const context = span.spanContext();
		if (!isTraceId(context.traceId) || !isSpanId(context.spanId)) {
			return undefined;
		}

		const scopeName = safeScopeName(scope?.name);
		const parentSpanContext = sanitizeParentSpanContext(span.parentSpanContext, context.traceId);

		const events = sanitizeEvents(span.events);
		const links = sanitizeLinks(span.links);
		const safe = {
			name: safeName(span.name, attributes), attributes, events, links,
			status: { code: span.status.code }, resource: { attributes: sanitizeResourceAttributes(span.resource?.attributes, policy) },
			instrumentationScope: { name: scopeName }, instrumentationLibrary: { name: scopeName },
			startTime: span.startTime, endTime: span.endTime, ended: true, kind: span.kind,
			duration: span.duration, droppedAttributesCount: 0, droppedEventsCount: 0, droppedLinksCount: 0,
			parentSpanContext,
			spanContext: () => ({ traceId: context.traceId, spanId: context.spanId, traceFlags: context.traceFlags, isRemote: context.isRemote }),
		} as unknown as ReadableSpan;

		// event の個別上限は生の UTF-8 バイト数で測るため、JSON 化時のエスケープで全体上限を超えうる。
		// 超過時は event から減らし、span 名や status をできるだけ残す。
		const measure = (): unknown => ({ name: safe.name, attributes, status: safe.status, resource: safe.resource, scope: safe.instrumentationScope, parentSpanContext, events, links });
		while (!isWithinObservabilityLimit(measure()) && events.length > 0) {
			events.pop();
		}
		if (!isWithinObservabilityLimit(measure())) {
			return undefined;
		}
		// SDK とこの処理が破棄した event の合計を、OTLP の uint32 上限内で報告する。
		const originalEventCount = Array.isArray(span.events) ? span.events.length : 0;
		const alreadyDropped = Number.isInteger(span.droppedEventsCount) && span.droppedEventsCount >= 0 ? span.droppedEventsCount : 0;
		(safe as { droppedEventsCount: number }).droppedEventsCount = Math.min(0xffff_ffff, alreadyDropped + Math.max(0, originalEventCount - events.length));
		return safe;
	} catch {
		// 加工できない情報は出力しない。元の情報を返す経路を作らないためである。
		return undefined;
	}
}

/**
 * 計測元の名前を取得する。
 * SDK の世代による項目名の違いを吸収し、以降の判定を一つの形式で扱う。
 */
function getScope(span: ReadableSpan): Scope {
	return (span as ReadableSpan & { instrumentationScope?: Scope; instrumentationLibrary?: Scope }).instrumentationScope
		?? (span as ReadableSpan & { instrumentationLibrary?: Scope }).instrumentationLibrary;
}

/**
 * 計測元の名前を、パッケージ名として妥当な形式に限って残す。
 * OTel-only 構成では、この検証が scope 名の出力境界になる。
 */
function safeScopeName(value: unknown): string {
	return typeof value === 'string' && /^@?[A-Za-z0-9._/-]{1,128}$/.test(value) ? value : marker;
}

// `@opentelemetry/api` の SpanKind と同じ値。出力可否の判定を数値のまま読み違えないようにする。
// この module は同 package を型としてしか読み込まないため、enum ではなくローカル定数で持つ。
const spanKindInternal = 0;
const spanKindServer = 1;
const spanKindClient = 2;

/**
 * Sentry と同じ計測提供者を使う場合に、出力を許可する計測情報か判定する。
 * 将来追加される計測を意図せず公開しないよう、確認済みの組み合わせだけを許可する。
 */
export function isAllowedCombinedScope(policy: 'none' | 'safe', scope: Scope, span: ReadableSpan, capture: CombinedScopeCaptureOptions = noCombinedScopeCapture): boolean {
	// Misskey 自身が作った計測情報は、常にこの処理の対象にする。
	if (scope?.name === 'misskey-backend') {
		return true;
	}

	const attrs = span.attributes as Record<string, unknown>;
	const origin = attrs['sentry.origin'];
	const isSentryScope = scope?.name === '@sentry/node';

	// Sentry の自動計装は、`safe` が明示された場合だけ OTLP への再出力候補にする。
	if (!isSentryScope || policy !== 'safe') {
		return false;
	}

	// PostgreSQL は、明示的に有効化した問い合わせと接続だけを許可する。
	// 確認済みの計測元・種別・名前の組み合わせ以外は出力しない。
	if (span.kind === spanKindClient && (attrs['db.system'] === 'postgresql' || attrs['db.system.name'] === 'postgresql')) {
		if (capture.capturePgSpans && origin === 'auto.db.otel.postgres' && pgQueryNamePattern.test(span.name)) {
			return true;
		}

		return capture.capturePgSpans
			&& capture.capturePgConnectionSpans
			&& origin == null
			&& (span.name === 'pg.connect' || span.name === 'pg-pool.connect');
	}

	// Redis は、明示的に有効化した接続と命令だけを許可する。
	// 親がない命令は、根の計測を許可した場合に限る。
	if (span.kind === spanKindInternal && origin === 'auto.db.redis.diagnostic_channel' && attrs['db.system.name'] === 'redis') {
		if (attrs['sentry.op'] === 'db.redis.connect' && span.name === 'redis-connect') {
			return capture.captureRedisConnectionSpans;
		}

		if (attrs['sentry.op'] === 'db.redis' && (redisCommandNamePattern.test(span.name) || span.name === 'MULTI' || span.name === 'PIPELINE')) {
			return capture.captureRedisCommandSpans && (capture.captureRedisRootSpans || span.parentSpanContext != null);
		}

		return false;
	}

	// Fastify の hook / route handler は、OTel-only 構成と同じく hook 区間の所要時間として残す。
	// 名前も属性もプラグイン登録時に確定する識別子だけで、リクエスト由来の値を含まない。
	if (span.kind === spanKindInternal && origin === 'auto.http.otel.fastify' && typeof attrs['sentry.op'] === 'string' && fastifyHookOps.has(attrs['sentry.op'])) {
		return true;
	}

	// HTTP は、ルートに一致した受信 span と、送信先を確認できる client span に限る。
	// 受信側は Sentry が使う旧属性名と現行の属性名の両方を受け付ける。
	return (span.kind === spanKindServer
			&& origin === 'auto.http.otel.http'
			&& attrs['sentry.op'] === 'http.server'
			&& (typeof attrs['http.method'] === 'string' || typeof attrs['http.request.method'] === 'string')
			&& typeof attrs['http.route'] === 'string')
		|| (span.kind === spanKindInternal
			&& origin === 'auto.http.client'
			&& attrs['sentry.op'] === 'http.client'
			&& typeof attrs['http.request.method'] === 'string'
			&& typeof attrs['url.full'] === 'string')
		// native fetch は別の origin を使い `sentry.op` を持たないため、専用の組み合わせで許可する。
		|| (span.kind === spanKindClient
			&& origin === 'auto.http.otel.node_fetch'
			&& typeof attrs['http.request.method'] === 'string'
			&& typeof attrs['url.full'] === 'string');
}

/**
 * 親の追跡情報から、子と同じ追跡単位に属する安全な項目だけを残す。
 *
 * 余分な状態や別の追跡単位を持ち込まないため、必要な四つの値を作り直す。
 */
function sanitizeParentSpanContext(value: unknown, traceId: string): { traceId: string; spanId: string; traceFlags: number; isRemote: boolean } | undefined {
	if (value == null || typeof value !== 'object') {
		return undefined;
	}
	const parent = value as Record<string, unknown>;
	if (parent.traceId !== traceId || !isSpanId(parent.spanId) || (parent.traceFlags !== 0 && parent.traceFlags !== 1)) {
		return undefined;
	}
	return {
		traceId,
		spanId: parent.spanId,
		traceFlags: parent.traceFlags,
		isRemote: parent.isRemote === true,
	};
}

// export先での表示・調査に必要な最小限に留め、1 span あたりの上限を明示する。
const maxLinks = 8;
const maxEvents = 4;

/**
 * span link を、追跡単位の識別子だけを持つ最小構成へ作り直す。
 *
 * jobTraceContextMode: 'link' では自 span とは別の trace を指すのが正常な使い方なので、
 * traceId の一致は求めず形式だけを確認する。attributes や traceState は利用者情報を含みうるため引き継がない。
 */
function sanitizeLinks(value: unknown): Array<{ context: { traceId: string; spanId: string; traceFlags: number; isRemote: boolean } }> {
	if (!Array.isArray(value)) {
		return [];
	}
	const links = [];
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
function sanitizeEvents(value: unknown): Array<{ name: 'exception'; time: unknown; droppedAttributesCount: 0; attributes: Record<string, string | number | boolean> }> {
	if (!Array.isArray(value)) {
		return [];
	}
	const events = [];
	for (const event of value) {
		const source = event as { name?: unknown; time?: unknown; attributes?: Record<string, unknown> } | null;
		if (source?.name !== 'exception') {
			continue;
		}
		// 属性名は 'error.type' の許可規則を借りて値を確認し、公開する属性名は semconv 通りの 'exception.type' に戻す。
		const type = sanitizeAttributes({ 'error.type': source.attributes?.['exception.type'] })['error.type'];
		const attributes: Record<string, string | number | boolean> = {};
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
			name: 'exception' as const,
			time: source.time,
			droppedAttributesCount: 0 as const,
			attributes,
		});
		if (events.length >= maxEvents) {
			break;
		}
	}
	return events;
}
