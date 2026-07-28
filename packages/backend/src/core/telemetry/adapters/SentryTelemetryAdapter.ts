/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import Logger from '@/logger.js';
import { registerDiagLogger } from '@/core/telemetry/telemetry-diag.js';
import { executeSpan, getQueueTraceContextMode, injectActiveTraceContext, startSpanWithQueueTraceContext } from '@/core/telemetry/queue-trace-context.js';
import { isAllowedCombinedScope, SanitizingSpanProcessor } from '@/core/telemetry/SanitizingSpanProcessor.js';
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

type BuildSentryIntegrationsOptions = {
	disabledIntegrations?: string[];
	enableNodeProfiling: boolean;
	nodeProfilingIntegration?: () => SentryIntegration;
	warn?: (message: string) => void;
};

export function buildSentryIntegrations(options: BuildSentryIntegrationsOptions): SentryIntegrationFactory {
	return (defaults) => {
		// 利用者が明示した無効化設定だけを反映し、Sentry 既定の計装選択を維持する。
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
): SentryNodeOptions {
	return {
		// ActivityPub や Webhook などの外部宛てには、既定で Sentry の trace header を送らない。
		// 信頼できる内部サービスだけ、管理者が設定で明示的に許可できる。
		tracePropagationTargets: [],

		// Performance Monitoring
		tracesSampleRate: 1.0, // transaction をすべて採取する

		// profiling の採取率は tracesSampleRate に対する相対値
		profilesSampleRate: 1.0,

		maxBreadcrumbs: 0,

		...config.options,

		integrations: buildSentryIntegrations({
			disabledIntegrations: config.disabledIntegrations,
			enableNodeProfiling: config.enableNodeProfiling,
			nodeProfilingIntegration,
		}),
	};
}

/**
 * Sentry の自動計装を OTLP へ再出力する範囲を検証する。
 * 未知の値は無効設定として扱わず、起動時に報告する。
 */
export function resolveSentryAutoInstrumentationExport(value: unknown): 'none' | 'safe' {
	if (value == null) {
		return 'none';
	}
	if (value !== 'none' && value !== 'safe') {
		throw new Error('otelForBackend.sentryAutoInstrumentationExport must be either \'none\' or \'safe\'.');
	}
	return value;
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
	// key が存在して値が `undefined` の項目を spread し、既定の `[]` を上書きしないよう、値を分離して明示時だけ戻す。
	const { tracePropagationTargets, ...sentryOptions } = options.sentryConfig.options;

	// 送信先の未指定は、絞り込み先の指定漏れか意図的な全許可かを判別できない。
	// 全 outbound host への伝播にも、無言での伝播無効にも倒さず、起動時に失敗させる。
	if (options.otelConfig.propagateTraceToRemote === true && tracePropagationTargets == null) {
		throw new Error('otelForBackend.propagateTraceToRemote is true but sentryForBackend.options.tracePropagationTargets is not set. Specify tracePropagationTargets explicitly (e.g. internal service hostnames only); otherwise the Sentry trace/baggage headers (including the project public key) would propagate to every outbound host.');
	}

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
				...(tracePropagationTargets != null ? { tracePropagationTargets } : {}),
			},
		}, options.nodeProfilingIntegration),

		// Sentryの単一TracerProviderにOTLP processorを追加し、親欠損や二重providerを避ける。
		// 利用者が登録した processor を保持し、設定の上書きを防ぐ。
		// TracerProvider は各 processor に同じ未加工の span を独立して渡すため、利用者の processor は sanitizer を経由しない。
		// 利用者自身の processor が送る情報の加工は、その processor と送信先の設定に委ねる。
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

	public static async create(config: SentryBackendConfig): Promise<SentryTelemetryAdapter> {
		const Sentry = await import('@sentry/node');
		const { nodeProfilingIntegration } = await import('@sentry/profiling-node');

		Sentry.init(buildSentryNodeOptions(config, nodeProfilingIntegration));

		return new SentryTelemetryAdapter(Sentry);
	}

	public static async createWithOtlpExport(
		sentryConfig: SentryBackendConfig,
		otelConfig: OtelBackendRuntimeConfig,
	): Promise<SentryTelemetryAdapter> {
		const Sentry = await import('@sentry/node');
		const { nodeProfilingIntegration } = await import('@sentry/profiling-node');
		const { context, diag, DiagLogLevel, propagation, ROOT_CONTEXT, SpanStatusCode, trace } = await import('@opentelemetry/api');
		const { BatchSpanProcessor } = await import('@opentelemetry/sdk-trace-base');
		const { OTLPTraceExporter } = await import('@opentelemetry/exporter-trace-otlp-proto');

		registerDiagLogger(diag, DiagLogLevel.WARN);

		// OTLP送信だけを担うprocessorを作り、provider生成はSentry.init側に任せる。
		const exportPolicy = resolveSentryAutoInstrumentationExport(otelConfig.sentryAutoInstrumentationExport);
		const exporter = new OTLPTraceExporter({
			...(otelConfig.endpoint != null ? { url: otelConfig.endpoint } : {}),
			...(otelConfig.headers != null ? { headers: otelConfig.headers } : {}),
		});
		const otlpProcessor = new SanitizingSpanProcessor(new BatchSpanProcessor(exporter), (scope, span) => isAllowedCombinedScope(exportPolicy, scope, span, {
			capturePgSpans: otelConfig.capturePgSpans === true,
			capturePgConnectionSpans: otelConfig.capturePgConnectionSpans === true,
			captureRedisCommandSpans: otelConfig.captureRedisCommandSpans === true,
			captureRedisConnectionSpans: otelConfig.captureRedisConnectionSpans === true,
			captureRedisRootSpans: otelConfig.captureRedisRootSpans === true,
		}), {
			allowDbStatement: otelConfig.capturePgStatement === true,
		});

		// SentryとOTLPを同一providerに集約することで、どちらの宛先にも同じspan実体を流す。
		Sentry.init(buildSentryOtlpInitOptions({
			sentryConfig,
			otelConfig,
			otlpProcessor,
			nodeProfilingIntegration,
		}));

		// Sentry が初期化した同じ OTel provider から tracer/context API を受け取り、
		// Queue を跨ぐ context 伝播も Sentry と OTLP の両方へ同一 span として出力する。
		const tracer = trace.getTracer('misskey-backend');
		return new SentryTelemetryAdapter(Sentry, {
			tracer,
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
		if (activeSpan == null) {
			return undefined;
		}

		const { traceId, spanId, traceFlags } = activeSpan.spanContext();
		return { traceId, spanId, traceFlags };
	}

	public startSpan<T>(name: string, fn: () => T): T {
		const queueTraceContext = this.queueTraceContext;
		if (queueTraceContext != null) {
			return queueTraceContext.tracer.startActiveSpan(name, span => executeSpan(span, fn, queueTraceContext.spanStatusCodeError));
		}
		return this.Sentry.startSpan({ name }, fn);
	}

	public injectTraceContext(carrier: QueueTraceContextCarrier): void {
		// Sentry 単体構成では queueTraceContext を持たず、従来どおりジョブデータを変更しない。
		if (this.queueTraceContext == null) {
			return;
		}
		injectActiveTraceContext(this.queueTraceContext, carrier);
	}

	public startSpanWithTraceContext<T>(name: string, jobData: object, fn: () => T): T {
		// Sentry 単体構成では Sentry 既存の span 作成経路を使う。
		if (this.queueTraceContext == null) {
			return this.startSpan(name, fn);
		}

		return startSpanWithQueueTraceContext(this.queueTraceContext, name, jobData, fn, () => this.startSpan(name, fn));
	}

	public async shutdown(): Promise<void> {
		// timeout未指定だとtransportのflushが詰まった際にプロセス終了を妨げるため、上限時間を設ける。
		await this.Sentry.close(DEFAULT_SHUTDOWN_TIMEOUT);
	}
}
