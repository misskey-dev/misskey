/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { Config } from '@/config.js';

const mocks = vi.hoisted(() => {
	return {
		sentryCreate: vi.fn(),
		sentryCreateWithOtlpExport: vi.fn(),
		otelCreate: vi.fn(),
	};
});

vi.mock('@/core/telemetry/adapters/SentryTelemetryAdapter.js', () => ({
	SentryTelemetryAdapter: {
		create: mocks.sentryCreate,
		createWithOtlpExport: mocks.sentryCreateWithOtlpExport,
	},
}));

vi.mock('@/core/telemetry/adapters/OpenTelemetryAdapter.js', () => ({
	OpenTelemetryAdapter: {
		create: mocks.otelCreate,
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
		mocks.sentryCreateWithOtlpExport.mockReset();
		mocks.otelCreate.mockReset();
		mocks.sentryCreate.mockResolvedValue({ shutdown: vi.fn(), captureMessage: vi.fn(), startSpan: vi.fn() });
		mocks.sentryCreateWithOtlpExport.mockResolvedValue({ shutdown: vi.fn(), captureMessage: vi.fn(), startSpan: vi.fn() });
		mocks.otelCreate.mockResolvedValue({ shutdown: vi.fn(), captureMessage: vi.fn(), startSpan: vi.fn() });
	});

	test('uses OpenTelemetryAdapter when only otelForBackend is configured', async () => {
		const { initTelemetry } = await import('@/core/telemetry/telemetry-registry.js');
		const otelForBackend = { endpoint: 'http://collector:4318/v1/traces' };

		await initTelemetry(config({ otelForBackend }));

		expect(mocks.otelCreate).toHaveBeenCalledWith({
			...otelForBackend,
			serviceVersion: '2026.1.0',
		});
		expect(mocks.sentryCreate).not.toHaveBeenCalled();
		expect(mocks.sentryCreateWithOtlpExport).not.toHaveBeenCalled();
	});

	test('adds OTLP export to the Sentry provider when both Sentry and OTel are configured', async () => {
		const { initTelemetry } = await import('@/core/telemetry/telemetry-registry.js');
		const sentryForBackend = { options: {}, enableNodeProfiling: false };
		const otelForBackend = { endpoint: 'http://collector:4318/v1/traces' };

		await initTelemetry(config({ sentryForBackend, otelForBackend }));

		expect(mocks.sentryCreateWithOtlpExport).toHaveBeenCalledWith(sentryForBackend, {
			...otelForBackend,
			serviceVersion: '2026.1.0',
		});
		expect(mocks.sentryCreate).not.toHaveBeenCalled();
		expect(mocks.otelCreate).not.toHaveBeenCalled();
	});

	test('startSpan runs fn directly when no adapter is registered', async () => {
		const { startSpan } = await import('@/core/telemetry/telemetry-registry.js');

		const fn = vi.fn().mockReturnValue('result');
		expect(startSpan('test', fn)).toBe('result');
		expect(fn).toHaveBeenCalledTimes(1);
	});

	test('startSpan delegates directly to the single registered adapter without extra wrapping', async () => {
		const { initTelemetry, startSpan } = await import('@/core/telemetry/telemetry-registry.js');
		const otelForBackend = { endpoint: 'http://collector:4318/v1/traces' };
		const adapterStartSpan = vi.fn((_name: string, fn: () => string) => fn());
		mocks.otelCreate.mockResolvedValue({ shutdown: vi.fn(), captureMessage: vi.fn(), startSpan: adapterStartSpan });

		await initTelemetry(config({ otelForBackend }));

		const fn = vi.fn().mockReturnValue('result');
		expect(startSpan('test', fn)).toBe('result');
		expect(adapterStartSpan).toHaveBeenCalledWith('test', fn);
	});

	test('startSpan wraps work through multiple registered adapters in order for future adapter combinations', async () => {
		const { initTelemetry, startSpan } = await import('@/core/telemetry/telemetry-registry.js');
		const calls: string[] = [];
		mocks.sentryCreate.mockResolvedValue({
			shutdown: vi.fn(),
			captureMessage: vi.fn(),
			startSpan: vi.fn((_name: string, fn: () => string) => {
				calls.push('sentry:start');
				const result = fn();
				calls.push('sentry:end');
				return result;
			}),
		});
		mocks.otelCreate.mockResolvedValue({
			shutdown: vi.fn(),
			captureMessage: vi.fn(),
			startSpan: vi.fn((_name: string, fn: () => string) => {
				calls.push('otel:start');
				const result = fn();
				calls.push('otel:end');
				return result;
			}),
		});

		await initTelemetry(config({ sentryForBackend: { options: {}, enableNodeProfiling: false } }));
		await initTelemetry(config({ otelForBackend: { endpoint: 'http://collector:4318/v1/traces' } }));

		const fn = vi.fn(() => {
			calls.push('work');
			return 'result';
		});

		expect(startSpan('test', fn)).toBe('result');
		expect(calls).toEqual(['sentry:start', 'otel:start', 'work', 'otel:end', 'sentry:end']);
	});

	test('shutdownTelemetry waits for every adapter even when one shutdown rejects', async () => {
		const { initTelemetry, shutdownTelemetry } = await import('@/core/telemetry/telemetry-registry.js');
		const sentryShutdown = vi.fn().mockRejectedValue(new Error('sentry failed'));
		const otelShutdown = vi.fn().mockResolvedValue(undefined);
		mocks.sentryCreate.mockResolvedValue({ shutdown: sentryShutdown, captureMessage: vi.fn(), startSpan: vi.fn() });
		mocks.otelCreate.mockResolvedValue({ shutdown: otelShutdown, captureMessage: vi.fn(), startSpan: vi.fn() });

		await initTelemetry(config({ sentryForBackend: { options: {}, enableNodeProfiling: false } }));
		await initTelemetry(config({ otelForBackend: { endpoint: 'http://collector:4318/v1/traces' } }));

		await expect(shutdownTelemetry()).resolves.toBeUndefined();
		expect(sentryShutdown).toHaveBeenCalledTimes(1);
		expect(otelShutdown).toHaveBeenCalledTimes(1);
	});
});
