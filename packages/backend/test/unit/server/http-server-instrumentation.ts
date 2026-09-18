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

vi.mock('@fastify/otel', () => ({
	FastifyOtelInstrumentation: class {
		public plugin = mocks.plugin;

		public constructor(options: unknown) {
			mocks.instrumentation(options);
		}
	},
}));

describe('http-server-instrumentation', () => {
	test('registers Fastify instrumentation when only OpenTelemetry is configured', async () => {
		const plugin = vi.fn();
		const fastify = { register: vi.fn().mockResolvedValue(undefined) };
		mocks.plugin.mockReturnValue(plugin);

		await registerHttpServerInstrumentation(fastify as any, { otelForBackend: {} } as any);

		expect(mocks.instrumentation).toHaveBeenCalledTimes(1);
		expect(fastify.register).toHaveBeenCalledWith(plugin);

		const requestHook = mocks.instrumentation.mock.calls[0][0].requestHook;
		const span = { updateName: vi.fn() };
		requestHook(span, { method: 'POST', routeOptions: { url: '/notes/create' } });
		expect(span.updateName).toHaveBeenCalledWith('POST /notes/create');
	});

	test('does not register duplicate request instrumentation with Sentry', async () => {
		const fastify = { register: vi.fn() };

		await registerHttpServerInstrumentation(fastify as any, { otelForBackend: {}, sentryForBackend: {} } as any);

		expect(fastify.register).not.toHaveBeenCalled();
		expect(shouldRegisterHttpServerInstrumentation({ otelForBackend: {}, sentryForBackend: {} } as any)).toBe(false);
	});

	test('does not register instrumentation without OpenTelemetry', () => {
		expect(shouldRegisterHttpServerInstrumentation({} as any)).toBe(false);
	});
});
