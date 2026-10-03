/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test, vi } from 'vitest';
import { DEFAULT_SENTRY_DATA_COLLECTION, SentryTelemetryAdapter, buildSentryIntegrations, buildSentryNodeOptions } from '@/core/telemetry/adapters/SentryTelemetryAdapter.js';

type SentryIntegrationFactory = ReturnType<typeof buildSentryIntegrations>;
type TestIntegration = Parameters<SentryIntegrationFactory>[0][number];

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

	test('restricts data collection by default', () => {
		const options = buildSentryNodeOptions({
			enableNodeProfiling: false,
			options: {},
		});

		expect(options.dataCollection).toEqual(DEFAULT_SENTRY_DATA_COLLECTION);
	});

	// Sentry v11は`dataCollection`未指定だと全て収集するため、既定が緩むと利用者の情報が意図せず送信される
	test('pins the categories that must not be collected by default', () => {
		expect(DEFAULT_SENTRY_DATA_COLLECTION).toEqual({
			userInfo: false,
			cookies: false,
			urlQueryParams: false,
			httpHeaders: {
				request: { deny: ['forwarded', '-ip', 'remote-', 'via', '-user'] },
				response: { deny: ['forwarded', '-ip', 'remote-', 'via', '-user'] },
			},
			httpBodies: [],
			databaseQueryData: false,
			genAI: { inputs: false, outputs: false },
		});
	});

	test('warns that the removed sendDefaultPii option is ignored', () => {
		const warn = vi.fn();

		const options = buildSentryNodeOptions({
			enableNodeProfiling: false,
			options: { sendDefaultPii: true } as Record<string, unknown>,
		}, undefined, warn);

		expect(warn).toHaveBeenCalledOnce();
		expect(warn.mock.calls[0][0]).toContain('sendDefaultPii');
		// 削除されたオプションでは既定を緩めない
		expect(options.dataCollection).toEqual(DEFAULT_SENTRY_DATA_COLLECTION);
	});

	test('does not warn when sendDefaultPii is absent', () => {
		const warn = vi.fn();

		buildSentryNodeOptions({ enableNodeProfiling: false, options: {} }, undefined, warn);

		expect(warn).not.toHaveBeenCalled();
	});

	// 呼び出し側が渡したロガーがintegrations側の警告にも届くこと(consoleへ逃げない)
	test('forwards the warn callback to the integrations factory', () => {
		const warn = vi.fn();

		const options = buildSentryNodeOptions({
			enableNodeProfiling: false,
			disabledIntegrations: ['NoSuchIntegration'],
			options: {},
		}, undefined, warn);

		(options.integrations as SentryIntegrationFactory)([testIntegration('Http')]);

		expect(warn).toHaveBeenCalledOnce();
		expect(warn.mock.calls[0][0]).toContain('NoSuchIntegration');
	});

	test('allows explicit dataCollection to override the default', () => {
		const options = buildSentryNodeOptions({
			enableNodeProfiling: false,
			options: {
				dataCollection: { userInfo: true },
			},
		});

		expect(options.dataCollection).toEqual({ userInfo: true });
	});

	test('uses session-based profiling tied to sampled traces', () => {
		const options = buildSentryNodeOptions({
			enableNodeProfiling: true,
			options: {},
		});

		expect(options.profileSessionSampleRate).toBe(1.0);
		expect(options.profileLifecycle).toBe('trace');
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
