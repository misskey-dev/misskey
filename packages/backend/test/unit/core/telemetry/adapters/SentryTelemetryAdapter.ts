/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test, vi } from 'vitest';
import { SentryTelemetryAdapter, buildSentryIntegrations, buildSentryNodeOptions, buildSentryOtlpInitOptions } from '@/core/telemetry/adapters/SentryTelemetryAdapter.js';

type TestIntegration = Parameters<ReturnType<typeof buildSentryIntegrations>>[0][number];

function testIntegration(name: string): TestIntegration {
	return { name };
}

describe('SentryTelemetryAdapter', () => {
	test('removes disabled integrations from Sentry defaults', () => {
		const integrations = buildSentryIntegrations({
			disabledIntegrations: ['Postgres'],
			enableNodeProfiling: false,
		});

		const result = integrations([
			testIntegration('Http'),
			testIntegration('Postgres'),
			testIntegration('Redis'),
		]);

		expect(result.map((integration: TestIntegration) => integration.name)).toEqual(['Http', 'Redis']);
	});

	test('keeps profiling integration when enabled', () => {
		const integrations = buildSentryIntegrations({
			disabledIntegrations: [],
			enableNodeProfiling: true,
			nodeProfilingIntegration: () => testIntegration('ProfilingIntegration'),
		});

		const result = integrations([
			testIntegration('Http'),
		]);

		expect(result.map((integration: TestIntegration) => integration.name)).toEqual(['Http', 'ProfilingIntegration']);
	});

	test('warns about unknown disabled integration names without removing defaults', () => {
		const warn = vi.fn();
		const integrations = buildSentryIntegrations({
			disabledIntegrations: ['Unknown'],
			enableNodeProfiling: false,
			warn,
		});

		const result = integrations([
			testIntegration('Http'),
		]);

		expect(result.map((integration: TestIntegration) => integration.name)).toEqual(['Http']);
		expect(warn).toHaveBeenCalledWith('Unknown Sentry integration configured in sentryForBackend.disabledIntegrations: Unknown');
	});

	test('disables outbound trace propagation by default', () => {
		const options = buildSentryNodeOptions({
			enableNodeProfiling: false,
			options: {},
		});

		expect(options.tracePropagationTargets).toEqual([]);
	});

	test('allows explicit tracePropagationTargets to override the default', () => {
		const options = buildSentryNodeOptions({
			enableNodeProfiling: false,
			options: {
				tracePropagationTargets: ['^https://internal\\.example/'],
			},
		});

		expect(options.tracePropagationTargets).toEqual(['^https://internal\\.example/']);
	});

	test('builds Sentry options that export spans to both Sentry and OTLP', () => {
		const existingProcessor = { name: 'existingProcessor' };
		const otlpProcessor = { name: 'otlpProcessor' };

		const result = buildSentryOtlpInitOptions({
			sentryConfig: {
				enableNodeProfiling: false,
				disabledIntegrations: ['Redis'],
				options: {
					openTelemetrySpanProcessors: [existingProcessor as any],
					tracesSampleRate: 0.25,
				},
			},
			otelConfig: {},
			otlpProcessor,
		});

		expect(result.tracesSampleRate).toBe(0.25);
		expect(result.openTelemetrySpanProcessors).toEqual([existingProcessor, otlpProcessor]);
		// OTel併存時もremoteへtrace headerを漏らさないデフォルトはSentry単体時と揃える。
		expect(result.tracePropagationTargets).toEqual([]);
		expect((result.integrations as any)([
			testIntegration('Http'),
			testIntegration('Redis'),
			testIntegration('Postgres'),
		]).map((integration: TestIntegration) => integration.name)).toEqual(['Http', 'Postgres']);
	});

	test('does not disable Sentry trace propagation when explicitly enabled for OTel coexistence', () => {
		const result = buildSentryOtlpInitOptions({
			sentryConfig: {
				enableNodeProfiling: false,
				options: {},
			},
			otelConfig: {
				propagateTraceToRemote: true,
			},
			otlpProcessor: { name: 'otlpProcessor' },
		});

		expect(result.tracePropagationTargets).toBeUndefined();
	});

	test('honors explicit tracePropagationTargets for OTel coexistence even without propagateTraceToRemote', () => {
		const result = buildSentryOtlpInitOptions({
			sentryConfig: {
				enableNodeProfiling: false,
				options: {
					tracePropagationTargets: ['^https://internal\\.example/'],
				},
			},
			otelConfig: {},
			otlpProcessor: { name: 'otlpProcessor' },
		});

		expect(result.tracePropagationTargets).toEqual(['^https://internal\\.example/']);
	});
});

describe('SentryTelemetryAdapter.shutdown', () => {
	test('bounds Sentry.close() with a timeout so a stuck transport cannot hang process shutdown', async () => {
		const close = vi.fn().mockResolvedValue(true);
		vi.doMock('@sentry/node', () => ({
			init: vi.fn(),
			close,
		}));
		vi.doMock('@sentry/profiling-node', () => ({
			nodeProfilingIntegration: vi.fn(),
		}));

		const adapter = await SentryTelemetryAdapter.create({
			enableNodeProfiling: false,
			options: {},
		});
		await adapter.shutdown();

		expect(close).toHaveBeenCalledTimes(1);
		expect(close).toHaveBeenCalledWith(expect.any(Number));
		expect(close.mock.calls[0][0]).toBeGreaterThan(0);

		vi.doUnmock('@sentry/node');
		vi.doUnmock('@sentry/profiling-node');
	});
});
