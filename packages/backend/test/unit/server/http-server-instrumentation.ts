/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test, vi } from 'vitest';
import { shouldRegisterHttpServerInstrumentation, registerHttpServerInstrumentation } from '@/server/http-server-instrumentation.js';

const mocks = vi.hoisted(() => ({
	plugin: vi.fn(),
	instrumentation: vi.fn(),
}));

vi.mock('@hono/otel', () => ({
	httpInstrumentationMiddleware: vi.fn().mockImplementation((options) => {
		mocks.instrumentation(options);
		return 'middleware';
	}),
}));

describe('http-server-instrumentation', () => {
	test('registers Hono instrumentation when only OpenTelemetry is configured', async () => {
		const honoApp = { use: vi.fn() };

		await registerHttpServerInstrumentation(honoApp as any, { otelForBackend: {} } as any);

		expect(mocks.instrumentation).toHaveBeenCalledTimes(1);
		expect(honoApp.use).toHaveBeenCalledWith('middleware');
	});

	test('does not register duplicate request instrumentation with OpenTelemetry and Sentry', async () => {
		const honoApp = { use: vi.fn() };

		await registerHttpServerInstrumentation(honoApp as any, { otelForBackend: {}, sentryForBackend: {} } as any);

		expect(honoApp.use).not.toHaveBeenCalled();
		expect(shouldRegisterHttpServerInstrumentation({ otelForBackend: {}, sentryForBackend: {} } as any)).toBe(false);
	});

	test('does not register instrumentation without OpenTelemetry', () => {
		expect(shouldRegisterHttpServerInstrumentation({} as any)).toBe(false);
	});
});
