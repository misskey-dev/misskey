/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test, vi } from 'vitest';
import { SentryTelemetryAdapter, buildSentryIntegrations, buildSentryNodeOptions } from '@/core/telemetry/adapters/SentryTelemetryAdapter.js';

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

		const result = integrations([testIntegration('Http')]);

		expect(result.map((integration: TestIntegration) => integration.name)).toEqual(['Http', 'ProfilingIntegration']);
	});

	test('warns about unknown disabled integration names without removing defaults', () => {
		const warn = vi.fn();
		const integrations = buildSentryIntegrations({
			disabledIntegrations: ['Unknown'],
			enableNodeProfiling: false,
			warn,
		});

		const result = integrations([testIntegration('Http')]);

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
});

describe('SentryTelemetryAdapter trace context', () => {
	test('returns the active span context for log enrichment', async () => {
		const activeSpan = {
			spanContext: () => ({
				traceId: '0123456789abcdef0123456789abcdef',
				spanId: '0123456789abcdef',
				traceFlags: 0,
			}),
		};
		vi.doMock('@sentry/node', () => ({
			init: vi.fn(),
			close: vi.fn(),
			getActiveSpan: vi.fn(() => activeSpan),
		}));
		vi.doMock('@sentry/profiling-node', () => ({
			nodeProfilingIntegration: vi.fn(),
		}));

		const adapter = await SentryTelemetryAdapter.create({
			enableNodeProfiling: false,
			options: {},
		});

		expect(adapter.getActiveTraceContext()).toEqual({
			traceId: '0123456789abcdef0123456789abcdef',
			spanId: '0123456789abcdef',
			traceFlags: 0,
		});

		vi.doUnmock('@sentry/node');
		vi.doUnmock('@sentry/profiling-node');
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
