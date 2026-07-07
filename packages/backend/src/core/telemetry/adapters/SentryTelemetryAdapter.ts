/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Config } from '@/config.js';
import type { TelemetryAdapter, TelemetryCaptureMessageOptions } from './TelemetryAdapter.js';

// OpenTelemetryAdapterのDEFAULT_SHUTDOWN_TIMEOUTと揃え、Sentryのtransportが詰まってもプロセス終了を妨げないようにする。
const DEFAULT_SHUTDOWN_TIMEOUT = 5000;

type SentryIntegrationsOption = NonNullable<import('@sentry/node').NodeOptions['integrations']>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SentryIntegrationFactory = Extract<SentryIntegrationsOption, (integrations: any[]) => any[]>;
type SentryIntegration = Parameters<SentryIntegrationFactory>[0][number];
type SentryNodeOptions = import('@sentry/node').NodeOptions;

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
	config: NonNullable<Config['sentryForBackend']>,
	nodeProfilingIntegration?: () => SentryIntegration,
): SentryNodeOptions {
	return {
		// Do not send Sentry trace headers to remote ActivityPub/Webhook/etc. hosts by default.
		// Admins can opt in for trusted internal services via sentryForBackend.options.
		tracePropagationTargets: [],

		// Performance Monitoring
		tracesSampleRate: 1.0, //  Capture 100% of the transactions

		// Set sampling rate for profiling - this is relative to tracesSampleRate
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

type BuildSentryOtlpInitOptions = {
	sentryConfig: NonNullable<Config['sentryForBackend']>;
	otelConfig: NonNullable<Config['otelForBackend']>;
	otlpProcessor: unknown;
	nodeProfilingIntegration?: () => SentryIntegration;
};

export function buildSentryOtlpInitOptions(options: BuildSentryOtlpInitOptions): SentryNodeOptions {
	// OTel併存時も、remoteへtrace headerを漏らさないデフォルトはSentry単体時と揃える。
	// propagateTraceToRemote: true か、options.tracePropagationTargets の明示指定がある場合のみ既定を上書きする。
	const { tracePropagationTargets, ...sentryOptions } = options.sentryConfig.options;
	const propagateTraceToRemote = options.otelConfig.propagateTraceToRemote === true || tracePropagationTargets != null;

	return {
		...buildSentryNodeOptions({
			...options.sentryConfig,
			options: {
				...sentryOptions,
				...(propagateTraceToRemote ? { tracePropagationTargets } : {}),
			},
		}, options.nodeProfilingIntegration),

		// Sentryの単一TracerProviderにOTLP processorを追加し、親欠損や二重providerを避ける。
		openTelemetrySpanProcessors: [
			...(options.sentryConfig.options.openTelemetrySpanProcessors ?? []),
			options.otlpProcessor as NonNullable<SentryNodeOptions['openTelemetrySpanProcessors']>[number],
		],
	};
}

export class SentryTelemetryAdapter implements TelemetryAdapter {
	private constructor(
		private readonly Sentry: typeof import('@sentry/node'),
	) {
	}

	public static async create(config: NonNullable<Config['sentryForBackend']>): Promise<SentryTelemetryAdapter> {
		const Sentry = await import('@sentry/node');
		const { nodeProfilingIntegration } = await import('@sentry/profiling-node');

		Sentry.init(buildSentryNodeOptions(config, nodeProfilingIntegration));

		return new SentryTelemetryAdapter(Sentry);
	}

	public static async createWithOtlpExport(
		sentryConfig: NonNullable<Config['sentryForBackend']>,
		otelConfig: NonNullable<Config['otelForBackend']>,
	): Promise<SentryTelemetryAdapter> {
		const Sentry = await import('@sentry/node');
		const { nodeProfilingIntegration } = await import('@sentry/profiling-node');
		const { BatchSpanProcessor } = await import('@opentelemetry/sdk-trace-base');
		const { OTLPTraceExporter } = await import('@opentelemetry/exporter-trace-otlp-proto');

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
		}));

		return new SentryTelemetryAdapter(Sentry);
	}

	public captureMessage(message: string, opts: TelemetryCaptureMessageOptions): void {
		this.Sentry.captureMessage(message, {
			level: opts.level,
			...(opts.userId != null ? { user: { id: opts.userId } } : {}),
			extra: opts.extra,
		});
	}

	public startSpan<T>(name: string, fn: () => T): T {
		return this.Sentry.startSpan({ name }, fn);
	}

	public async shutdown(): Promise<void> {
		// timeout未指定だとtransportのflushが詰まった際にプロセス終了を妨げるため、上限時間を設ける。
		await this.Sentry.close(DEFAULT_SHUTDOWN_TIMEOUT);
	}
}
