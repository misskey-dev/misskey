/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { apiUrl } from '@@/js/config.js';
import type { App } from 'vue';
import type * as Misskey from 'misskey-js';

export async function initTelemetry(instance: Misskey.entities.MetaDetailed, app: App): Promise<void> {
	if (!instance.sentryForFrontend) return;

	const Sentry = await import('@sentry/vue');
	Sentry.init({
		app,
		integrations: [
			...(instance.sentryForFrontend.vueIntegration !== undefined ? [
				Sentry.vueIntegration(instance.sentryForFrontend.vueIntegration ?? undefined),
			] : []),
			...(instance.sentryForFrontend.browserTracingIntegration !== undefined ? [
				Sentry.browserTracingIntegration(instance.sentryForFrontend.browserTracingIntegration ?? undefined),
			] : []),
			...(instance.sentryForFrontend.replayIntegration !== undefined ? [
				Sentry.replayIntegration(instance.sentryForFrontend.replayIntegration ?? undefined),
			] : []),
		],

		// Set tracesSampleRate to 1.0 to capture 100%
		tracesSampleRate: 1.0,

		// Set `tracePropagationTargets` to control for which URLs distributed tracing should be enabled
		...(instance.sentryForFrontend.browserTracingIntegration !== undefined ? {
			tracePropagationTargets: [apiUrl],
		} : {}),

		// Capture Replay for 10% of all sessions,
		// plus for 100% of sessions with an error
		...(instance.sentryForFrontend.replayIntegration !== undefined ? {
			replaysSessionSampleRate: 0.1,
			replaysOnErrorSampleRate: 1.0,
		} : {}),

		...instance.sentryForFrontend.options,
	});
}
