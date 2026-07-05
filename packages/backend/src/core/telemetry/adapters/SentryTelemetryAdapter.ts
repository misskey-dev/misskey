/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Config } from '@/config.js';
import type { TelemetryAdapter, TelemetryCaptureMessageOptions } from './TelemetryAdapter.js';

type SentryIntegrationsOption = NonNullable<import('@sentry/node').NodeOptions['integrations']>;
type SentryIntegrationFactory = Extract<SentryIntegrationsOption, (integrations: any[]) => any[]>;
type SentryIntegration = Parameters<SentryIntegrationFactory>[0][number];

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

export class SentryTelemetryAdapter implements TelemetryAdapter {
	private constructor(
		private readonly Sentry: typeof import('@sentry/node'),
	) {
	}

	public static async create(config: NonNullable<Config['sentryForBackend']>): Promise<SentryTelemetryAdapter> {
		const Sentry = await import('@sentry/node');
		const { nodeProfilingIntegration } = await import('@sentry/profiling-node');

		Sentry.init({
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
		});

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
		await this.Sentry.close();
	}
}
