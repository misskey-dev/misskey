/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { LogTraceContext } from '@/logging/types.js';
import type * as SentryNode from '@sentry/node';
import type { NodeOptions } from '@sentry/node';
import type { SentryBackendConfig, TelemetryAdapter, TelemetryCaptureMessageOptions } from './TelemetryAdapter.js';

// Sentryのtransportが詰まってもプロセス終了を妨げないようにする。
const DEFAULT_SHUTDOWN_TIMEOUT = 5000;

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

export class SentryTelemetryAdapter implements TelemetryAdapter {
	private constructor(
		private readonly Sentry: typeof SentryNode,
	) {
	}

	public static async create(config: SentryBackendConfig): Promise<SentryTelemetryAdapter> {
		const Sentry = await import('@sentry/node');
		const { nodeProfilingIntegration } = await import('@sentry/profiling-node');

		Sentry.init(buildSentryNodeOptions(config, nodeProfilingIntegration));

		return new SentryTelemetryAdapter(Sentry);
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

	public async shutdown(): Promise<void> {
		// timeout未指定だとtransportのflushが詰まった際にプロセス終了を妨げるため、上限時間を設ける。
		await this.Sentry.close(DEFAULT_SHUTDOWN_TIMEOUT);
	}
}
