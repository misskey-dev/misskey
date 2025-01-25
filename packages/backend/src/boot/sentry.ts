/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { Config } from '@/config.js';

export function sentryInit(config: Config) {
	if (!config.sentryForBackend) {
		return;
	}

	Sentry.init({
		integrations: [
			...(config.sentryForBackend.enableNodeProfiling ? [nodeProfilingIntegration()] : []),
		],

		// Performance Monitoring
		tracesSampleRate: 1.0, //  Capture 100% of the transactions

		// Set sampling rate for profiling - this is relative to tracesSampleRate
		profilesSampleRate: 1.0,

		maxBreadcrumbs: 0,

		...config.sentryForBackend.options,
	});
}
