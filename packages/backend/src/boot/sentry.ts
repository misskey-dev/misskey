/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Config } from '@/config.js';

export async function sentryInit(config: Config): Promise<void> {
	if (!config.sentryForBackend) {
		return;
	}

	const Sentry = await import('@sentry/node');
	const integrations = config.sentryForBackend.enableNodeProfiling
		? [(await import('@sentry/profiling-node')).nodeProfilingIntegration()]
		: [];

	Sentry.init({
		integrations,

		// Performance Monitoring
		tracesSampleRate: 1.0, //  Capture 100% of the transactions

		// Set sampling rate for profiling - this is relative to tracesSampleRate
		profilesSampleRate: 1.0,

		maxBreadcrumbs: 0,

		...config.sentryForBackend.options,
	});
}
