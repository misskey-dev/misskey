/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Config } from '@/config.js';
import type { Hono } from 'hono';
import type { ApiEnv } from './api/ApiServerTypes.js';

type TelemetryConfig = Pick<Config, 'otelForBackend' | 'sentryForBackend'>;

export function shouldRegisterHttpServerInstrumentation(config: TelemetryConfig): boolean {
	// Sentryもリクエストspanを作成するため、両方を登録すると重複して出力される。
	return config.otelForBackend != null && config.sentryForBackend == null;
}

/**
 * すべてのルート・フックより前にリクエスト計装を登録し、ActivityPubや
 * well-knownを含む全HTTP受信経路を1つのroot spanとして計測する。
 */
export async function registerHttpServerInstrumentation(honoApp: Hono<ApiEnv>, config: TelemetryConfig): Promise<void> {
	if (!shouldRegisterHttpServerInstrumentation(config)) return;

	const { httpInstrumentationMiddleware } = await import('@hono/otel');
	honoApp.use(httpInstrumentationMiddleware({
		spanNameFactory: (ctx) => {
			// デフォルトだとトレース名が「request」で固定されてしまうため、判別がつかなくなる。
			// ルート名をspan名に設定することで、トレースビューでルートごとの処理時間を確認できるようになる。
			return `${ctx.req.method} ${ctx.req.path}`;
		},
	}));
}
