/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { Config } from '@/config.js';
import type { LogRecordInput } from '@/logging/types.js';

const mocks = vi.hoisted(() => {
	return {
		sentryCreate: vi.fn(),
		setLogTraceContextProvider: vi.fn(),
		logWrite: vi.fn<(input: LogRecordInput) => void>(),
	};
});

// telemetry-registryは`@/logger.js`経由でlogManagerも参照するため、両方をmockする。
vi.mock('@/logging/logging-runtime.js', () => ({
	setLogTraceContextProvider: mocks.setLogTraceContextProvider,
	logManager: { write: mocks.logWrite },
}));

vi.mock('@/core/telemetry/adapters/SentryTelemetryAdapter.js', () => ({
	SentryTelemetryAdapter: {
		create: mocks.sentryCreate,
	},
}));

function config(overrides: Partial<Config>): Config {
	return {
		version: '2026.1.0',
		...overrides,
	} as Config;
}

describe('telemetry-registry', () => {
	beforeEach(() => {
		vi.resetModules();
		mocks.sentryCreate.mockReset();
		mocks.setLogTraceContextProvider.mockReset();
		mocks.logWrite.mockReset();
		mocks.sentryCreate.mockResolvedValue({ shutdown: vi.fn(), captureMessage: vi.fn(), startSpan: vi.fn() });
	});

	test('does not initialize an adapter when Sentry is not configured', async () => {
		const { initTelemetry } = await import('@/core/telemetry/telemetry-registry.js');

		await initTelemetry(config({}));

		expect(mocks.sentryCreate).not.toHaveBeenCalled();
		expect(mocks.setLogTraceContextProvider).not.toHaveBeenCalled();
	});

	test('initializes Sentry and registers its trace context provider', async () => {
		const { initTelemetry } = await import('@/core/telemetry/telemetry-registry.js');
		const sentryForBackend = { options: {}, enableNodeProfiling: false };
		const getActiveTraceContext = vi.fn(() => ({
			traceId: '0123456789abcdef0123456789abcdef',
			spanId: '0123456789abcdef',
			traceFlags: 0,
		}));
		mocks.sentryCreate.mockResolvedValue({
			shutdown: vi.fn(),
			captureMessage: vi.fn(),
			startSpan: vi.fn(),
			getActiveTraceContext,
		});

		await initTelemetry(config({ sentryForBackend }));

		expect(mocks.sentryCreate).toHaveBeenCalledWith(sentryForBackend, expect.any(Function));
		expect(mocks.setLogTraceContextProvider).toHaveBeenCalledWith(expect.any(Function));
		const provider = mocks.setLogTraceContextProvider.mock.calls[0][0] as () => unknown;
		expect(provider()).toEqual({
			traceId: '0123456789abcdef0123456789abcdef',
			spanId: '0123456789abcdef',
			traceFlags: 0,
		});
		expect(getActiveTraceContext).toHaveBeenCalledOnce();
	});

	test('routes adapter warnings to the Misskey logger instead of the console', async () => {
		const { initTelemetry } = await import('@/core/telemetry/telemetry-registry.js');

		await initTelemetry(config({ sentryForBackend: { options: {}, enableNodeProfiling: false } }));

		const warn = mocks.sentryCreate.mock.calls[0][1] as (message: string) => void;
		warn('sentryForBackend.options.sendDefaultPii was removed');

		expect(mocks.logWrite).toHaveBeenCalledOnce();
		expect(mocks.logWrite.mock.calls[0][0]).toMatchObject({
			level: 'warn',
			message: 'sentryForBackend.options.sendDefaultPii was removed',
			context: [{ name: 'telemetry', color: undefined }],
		});
	});

	test('startSpan runs fn directly when no adapter is registered', async () => {
		const { startSpan } = await import('@/core/telemetry/telemetry-registry.js');

		const fn = vi.fn().mockReturnValue('result');
		expect(startSpan('test', fn)).toBe('result');
		expect(fn).toHaveBeenCalledTimes(1);
	});

	test('startSpan delegates to the Sentry adapter', async () => {
		const { initTelemetry, startSpan } = await import('@/core/telemetry/telemetry-registry.js');
		const adapterStartSpan = vi.fn((_name: string, fn: () => string) => fn());
		mocks.sentryCreate.mockResolvedValue({ shutdown: vi.fn(), captureMessage: vi.fn(), startSpan: adapterStartSpan });

		await initTelemetry(config({ sentryForBackend: { options: {}, enableNodeProfiling: false } }));

		const fn = vi.fn().mockReturnValue('result');
		expect(startSpan('test', fn)).toBe('result');
		expect(adapterStartSpan).toHaveBeenCalledWith('test', fn);
	});

	test('shutdownTelemetry waits for all registered adapters even when one rejects', async () => {
		const { initTelemetry, shutdownTelemetry } = await import('@/core/telemetry/telemetry-registry.js');
		const firstShutdown = vi.fn().mockRejectedValue(new Error('first failed'));
		const secondShutdown = vi.fn().mockResolvedValue(undefined);
		mocks.sentryCreate
			.mockResolvedValueOnce({ shutdown: firstShutdown, captureMessage: vi.fn(), startSpan: vi.fn() })
			.mockResolvedValueOnce({ shutdown: secondShutdown, captureMessage: vi.fn(), startSpan: vi.fn() });

		const sentryForBackend = { options: {}, enableNodeProfiling: false };
		await initTelemetry(config({ sentryForBackend }));
		await initTelemetry(config({ sentryForBackend }));

		await expect(shutdownTelemetry()).resolves.toBeUndefined();
		expect(firstShutdown).toHaveBeenCalledTimes(1);
		expect(secondShutdown).toHaveBeenCalledTimes(1);
	});
});
