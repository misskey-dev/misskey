/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { apiUrl } from '@@/js/config.js';
import type { App } from 'vue';
import type * as Misskey from 'misskey-js';

const DEFAULT_PII_DENYLIST = { deny: ['forwarded', '-ip', 'remote-', 'via', '-user'] };

export async function initTelemetry(instance: Misskey.entities.MetaDetailed, app: App): Promise<void> {
	if (!instance.sentryForFrontend) return;

	const Sentry = await import('@sentry/vue');

	// Sentry v11 では dataCollection 未指定だと全て収集されるため、v10 の sendDefaultPii 未指定時の挙動を明示する。
	// v10 の sendDefaultPii: true は v11 のデフォルトと同等なので、その場合は制限を適用しない。
	const v10SendDefaultPii = instance.sentryForFrontend.options.sendDefaultPii === true;

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

		...(v10SendDefaultPii ? {} : {
			dataCollection: {
				userInfo: false,
				cookies: false,
				httpHeaders: {
					request: DEFAULT_PII_DENYLIST,
					response: DEFAULT_PII_DENYLIST,
				},
				httpBodies: [],
				urlQueryParams: DEFAULT_PII_DENYLIST,
				genAI: { inputs: false, outputs: false },
				databaseQueryData: false,
				graphQL: { document: false, variables: false },
			},
		}),

		...instance.sentryForFrontend.options,
	});
}
