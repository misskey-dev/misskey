/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import Logger from '@/logger.js';
import { registerDiagLogger } from '@/core/telemetry/telemetry-diag.js';
import { getQueueTraceContextMode, injectActiveTraceContext, startSpanWithQueueTraceContext } from '@/core/telemetry/queue-trace-context.js';
import type { LogTraceContext } from '@/logging/types.js';
import type * as SentryNode from '@sentry/node';
import type { NodeOptions } from '@sentry/node';
import type { OtelBackendRuntimeConfig, SentryBackendConfig, TelemetryAdapter, TelemetryCaptureMessageOptions } from './TelemetryAdapter.js';
import type { QueueTraceContextCarrier, QueueTraceContextDeps } from '../queue-trace-context.js';

// OpenTelemetryAdapterのDEFAULT_SHUTDOWN_TIMEOUTと揃え、Sentryのtransportが詰まってもプロセス終了を妨げないようにする。
const DEFAULT_SHUTDOWN_TIMEOUT = 5000;
const logger = new Logger('telemetry', 'green');

type SentryIntegrationsOption = NonNullable<NodeOptions['integrations']>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SentryIntegrationFactory = Extract<SentryIntegrationsOption, (integrations: any[]) => any[]>;
type SentryIntegration = Parameters<SentryIntegrationFactory>[0][number];
type SentryNodeOptions = NodeOptions;
type SentryDataCollection = NonNullable<NodeOptions['dataCollection']>;

/** 中継元のアドレスや利用者を特定できるHTTPヘッダー名の断片 */
const PEER_IDENTIFYING_HEADER_SNIPPETS = ['forwarded', '-ip', 'remote-', 'via', '-user'];

/**
 * Misskeyが既定で適用する収集範囲
 *
 * Sentry v11 は `dataCollection` 未指定だと全て収集するため、利用者の情報が意図せず送信されないよう既定を絞る
 * 緩める場合は設定ファイルの `dataCollection` で明示する
 */
export const DEFAULT_SENTRY_DATA_COLLECTION: SentryDataCollection = {
	// IPやユーザーIDの自動付与はしない。調査に必要な識別子はTelemetryService側で明示的に渡す
	userInfo: false,
	// backendは認証にCookieを使わないため、収集しても調査の役に立たない
	cookies: false,
	// GETのAPI呼び出しはアクセストークンを`i`クエリパラメータでも受け取るため落とす
	urlQueryParams: false,
	httpHeaders: {
		request: { deny: PEER_IDENTIFYING_HEADER_SNIPPETS },
		response: { deny: PEER_IDENTIFYING_HEADER_SNIPPETS },
	},
	// リクエスト・レスポンス本文はノートやチャットの内容を含む
	httpBodies: [],
	// クエリのバインド値や書き込みペイロードは利用者の投稿内容を含む
	databaseQueryData: false,
	genAI: { inputs: false, outputs: false },
};

type BuildSentryIntegrationsOptions = {
	disabledIntegrations?: string[];
	enableNodeProfiling: boolean;
	nodeProfilingIntegration?: () => SentryIntegration;
	warn?: (message: string) => void;
};

export function buildSentryIntegrations(options: BuildSentryIntegrationsOptions): SentryIntegrationFactory {
	return (defaults) => {
		const disabledIntegrations = new Set(options.disabledIntegrations ?? []);
		const defaultIntegrationNames = new Set(defaults.map((integration) => integration.name));
		const unknownIntegrations = [...disabledIntegrations].filter((name) => !defaultIntegrationNames.has(name));

		if (unknownIntegrations.length > 0) {
			(options.warn ?? console.warn)(`Unknown Sentry integration configured in sentryForBackend.disabledIntegrations: ${unknownIntegrations.join(', ')}`);
		}

		return [
			...defaults.filter((integration) => !disabledIntegrations.has(integration.name)),
			...(options.enableNodeProfiling && options.nodeProfilingIntegration != null ? [options.nodeProfilingIntegration()] : []),
		];
	};
}

export function buildSentryNodeOptions(
	config: SentryBackendConfig,
	nodeProfilingIntegration?: () => SentryIntegration,
	warn?: (message: string) => void,
): SentryNodeOptions {
	if ('sendDefaultPii' in config.options) {
		(warn ?? console.warn)('sentryForBackend.options.sendDefaultPii was removed in Sentry SDK v11 and is ignored. Use sentryForBackend.options.dataCollection instead (`dataCollection: {}` collects everything, as `sendDefaultPii: true` did).');
	}

	return {
		// Do not send Sentry trace headers to remote ActivityPub/Webhook/etc. hosts by default.
		// Admins can opt in for trusted internal services via sentryForBackend.options.
		tracePropagationTargets: [],

		// Performance Monitoring
		tracesSampleRate: 1.0, //  Capture 100% of the transactions

		// Profile every sampled trace (session-based profiling; relative to tracesSampleRate)
		profileSessionSampleRate: 1.0,
		profileLifecycle: 'trace',

		maxBreadcrumbs: 0,

		dataCollection: DEFAULT_SENTRY_DATA_COLLECTION,

		...config.options,

		integrations: buildSentryIntegrations({
			disabledIntegrations: config.disabledIntegrations,
			enableNodeProfiling: config.enableNodeProfiling,
			nodeProfilingIntegration,
			warn,
		}),
	};
}

type BuildSentryOtlpInitOptions = {
	sentryConfig: SentryBackendConfig;
	otelConfig: OtelBackendRuntimeConfig;
	otlpProcessor: unknown;
	nodeProfilingIntegration?: () => SentryIntegration;
	warn?: (message: string) => void;
};

export function buildSentryOtlpInitOptions(options: BuildSentryOtlpInitOptions): SentryNodeOptions {
	// OTel併存時も、remoteへtrace headerを漏らさないデフォルトはSentry単体時と揃える。
	// propagateTraceToRemote: true か、options.tracePropagationTargets の明示指定がある場合のみ既定を上書きする。
	const { tracePropagationTargets, ...sentryOptions } = options.sentryConfig.options;
	const propagateTraceToRemote = options.otelConfig.propagateTraceToRemote === true || tracePropagationTargets != null;
	const warn = options.warn ?? ((message: string) => logger.warn(message));

	if (options.otelConfig.sampleRate != null) {
		warn('otelForBackend.sampleRate is ignored when sentryForBackend is also configured; configure sentryForBackend.options.tracesSampleRate or tracesSampler instead.');
	}

	if (options.otelConfig.resourceAttributes != null) {
		warn('otelForBackend.resourceAttributes is ignored when sentryForBackend is also configured; configure OTEL_RESOURCE_ATTRIBUTES instead.');
	}

	return {
		...buildSentryNodeOptions({
			...options.sentryConfig,
			options: {
				...sentryOptions,
				...(propagateTraceToRemote ? { tracePropagationTargets } : {}),
			},
		}, options.nodeProfilingIntegration, warn),

		// Sentryの単一TracerProviderにOTLP processorを追加し、親欠損や二重providerを避ける。
		openTelemetrySpanProcessors: [
			...(options.sentryConfig.options.openTelemetrySpanProcessors ?? []),
			options.otlpProcessor as NonNullable<SentryNodeOptions['openTelemetrySpanProcessors']>[number],
		],
	};
}

export class SentryTelemetryAdapter implements TelemetryAdapter {
	private constructor(
		private readonly Sentry: typeof SentryNode,
		private readonly queueTraceContext?: QueueTraceContextDeps,
	) {
	}

	public static async create(config: SentryBackendConfig, warn?: (message: string) => void): Promise<SentryTelemetryAdapter> {
		const Sentry = await import('@sentry/node');
		const { nodeProfilingIntegration } = await import('@sentry/profiling-node');

		Sentry.init(buildSentryNodeOptions(config, nodeProfilingIntegration, warn));

		return new SentryTelemetryAdapter(Sentry);
	}

	public static async createWithOtlpExport(
		sentryConfig: SentryBackendConfig,
		otelConfig: OtelBackendRuntimeConfig,
		warn?: (message: string) => void,
	): Promise<SentryTelemetryAdapter> {
		const Sentry = await import('@sentry/node');
		const { nodeProfilingIntegration } = await import('@sentry/profiling-node');
		const { context, diag, DiagLogLevel, propagation, ROOT_CONTEXT, SpanStatusCode, trace } = await import('@opentelemetry/api');
		const { BatchSpanProcessor } = await import('@opentelemetry/sdk-trace-base');
		const { OTLPTraceExporter } = await import('@opentelemetry/exporter-trace-otlp-proto');

		registerDiagLogger(diag, DiagLogLevel.WARN);

		// OTLP送信だけを担うprocessorを作り、provider生成はSentry.init側に任せる。
		const otlpProcessor = new BatchSpanProcessor(new OTLPTraceExporter({
			...(otelConfig.endpoint != null ? { url: otelConfig.endpoint } : {}),
			...(otelConfig.headers != null ? { headers: otelConfig.headers } : {}),
		}));

		// SentryとOTLPを同一providerに集約することで、どちらの宛先にも同じspan実体を流す。
		Sentry.init(buildSentryOtlpInitOptions({
			sentryConfig,
			otelConfig,
			otlpProcessor,
			nodeProfilingIntegration,
			warn,
		}));

		// Sentry が初期化した同じ OTel provider から tracer/context API を受け取り、
		// Queue を跨ぐ context 伝播も Sentry と OTLP の両方へ同一 span として出力する。
		return new SentryTelemetryAdapter(Sentry, {
			tracer: trace.getTracer('misskey-backend'),
			propagation,
			trace,
			getActiveContext: () => context.active(),
			rootContext: ROOT_CONTEXT,
			mode: getQueueTraceContextMode(otelConfig.jobTraceContextMode),
			spanStatusCodeError: SpanStatusCode.ERROR,
		});
	}

	public captureMessage(message: string, opts: TelemetryCaptureMessageOptions): void {
		this.Sentry.captureMessage(message, {
			level: opts.level,
			...(opts.userId != null ? { user: { id: opts.userId } } : {}),
			extra: opts.extra,
		});
	}

	/** activeなSpanの識別子を、Logging基盤で扱える形式へ変換します。 */
	public getActiveTraceContext(): LogTraceContext | undefined {
		const activeSpan = this.Sentry.getActiveSpan();
		if (activeSpan == null) return undefined;

		const { traceId, spanId, traceFlags } = activeSpan.spanContext();
		return { traceId, spanId, traceFlags };
	}

	public startSpan<T>(name: string, fn: () => T): T {
		return this.Sentry.startSpan({ name }, fn);
	}

	public injectTraceContext(carrier: QueueTraceContextCarrier): void {
		// Sentry 単体構成では queueTraceContext を持たず、従来どおりジョブデータを変更しない。
		if (this.queueTraceContext == null) return;
		injectActiveTraceContext(this.queueTraceContext, carrier);
	}

	public startSpanWithTraceContext<T>(name: string, jobData: object, fn: () => T): T {
		// Sentry 単体構成では Sentry 既存の span 作成経路を使う。
		if (this.queueTraceContext == null) return this.startSpan(name, fn);

		return startSpanWithQueueTraceContext(this.queueTraceContext, name, jobData, fn, () => this.startSpan(name, fn));
	}

	public async shutdown(): Promise<void> {
		// timeout未指定だとtransportのflushが詰まった際にプロセス終了を妨げるため、上限時間を設ける。
		await this.Sentry.close(DEFAULT_SHUTDOWN_TIMEOUT);
	}
}
