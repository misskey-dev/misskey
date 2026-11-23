/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { apiUrl } from '@@/js/config.js';
import type { App } from 'vue';
import type * as Misskey from 'misskey-js';

/** 中継元のアドレスや利用者を特定できるHTTPヘッダー名の断片 */
const PEER_IDENTIFYING_HEADER_SNIPPETS = ['forwarded', '-ip', 'remote-', 'via', '-user'];

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

		// Sentry v11は`dataCollection`未指定だと全て収集するため、既定を絞る
		// 緩める場合はサーバー側の設定で`dataCollection`を明示する
		dataCollection: {
			userInfo: false,
			cookies: false,
			// GETのAPI呼び出しはアクセストークンを`i`クエリパラメータでも受け取るため落とす
			urlQueryParams: false,
			httpHeaders: {
				request: { deny: PEER_IDENTIFYING_HEADER_SNIPPETS },
				response: { deny: PEER_IDENTIFYING_HEADER_SNIPPETS },
			},
			httpBodies: [],
			databaseQueryData: false,
			genAI: { inputs: false, outputs: false },
		},

		...instance.sentryForFrontend.options,
	});
}
