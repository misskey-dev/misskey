/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test, vi } from 'vitest';
import { normalizeSentryBackendConfig } from '@/config.js';
import {
	DEFAULT_SENTRY_DATA_COLLECTION,
	SentryTelemetryAdapter,
	buildSentryIntegrations,
	buildSentryNodeOptions,
	buildSentryOpenTelemetryLinkedInitOptions,
	resolveSentryOtlpExportTarget,
} from '@/core/telemetry/adapters/SentryTelemetryAdapter.js';

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

describe('buildSentryOpenTelemetryLinkedInitOptions', () => {
	const openTelemetryIntegration = () => testIntegration('OpenTelemetry');

	test('leaves tracing to OpenTelemetry and links Sentry events to OTel spans', () => {
		const result = buildSentryOpenTelemetryLinkedInitOptions({
			sentryConfig: {
				enableNodeProfiling: false,
				disabledIntegrations: ['Redis'],
				options: {},
			},
			otelConfig: { serviceVersion: '2026.1.0' },
			openTelemetryIntegration,
		});

		// tracesSampleRateを設定するとSentryが自前のspanを別traceとして発行してしまう。
		expect(result).not.toHaveProperty('tracesSampleRate');
		expect(result).not.toHaveProperty('profileSessionSampleRate');
		expect(result).not.toHaveProperty('profileLifecycle');
		expect(result.integrations).toBeTypeOf('function');
		if (typeof result.integrations !== 'function') throw new Error('Expected integrations to be a function');
		expect(result.integrations([
			testIntegration('Http'),
			testIntegration('Redis'),
		]).map((integration: TestIntegration) => integration.name)).toEqual(['Http', 'OpenTelemetry']);
	});

	test('keeps Sentry-only safe defaults', () => {
		const result = buildSentryOpenTelemetryLinkedInitOptions({
			sentryConfig: normalizeSentryBackendConfig({
				enableNodeProfiling: false,
			}),
			otelConfig: { serviceVersion: '2026.1.0' },
			openTelemetryIntegration,
		});

		expect(result.tracePropagationTargets).toEqual([]);
		expect(result.dataCollection).toEqual(DEFAULT_SENTRY_DATA_COLLECTION);
	});

	test('does not disable Sentry trace propagation when explicitly enabled for OTel coexistence', () => {
		const result = buildSentryOpenTelemetryLinkedInitOptions({
			sentryConfig: {
				enableNodeProfiling: false,
				options: {},
			},
			otelConfig: {
				serviceVersion: '2026.1.0',
				propagateTraceToRemote: true,
			},
			openTelemetryIntegration,
		});

		expect(result.tracePropagationTargets).toBeUndefined();
	});

	test('honors explicit tracePropagationTargets for OTel coexistence even without propagateTraceToRemote', () => {
		const result = buildSentryOpenTelemetryLinkedInitOptions({
			sentryConfig: {
				enableNodeProfiling: false,
				options: {
					tracePropagationTargets: ['^https://internal\\.example/'],
				},
			},
			otelConfig: { serviceVersion: '2026.1.0' },
			openTelemetryIntegration,
		});

		expect(result.tracePropagationTargets).toEqual(['^https://internal\\.example/']);
	});

	test('warns when Sentry-only tracing options are ignored in OTel coexistence mode', () => {
		const warn = vi.fn();

		const result = buildSentryOpenTelemetryLinkedInitOptions({
			sentryConfig: {
				enableNodeProfiling: true,
				options: {
					tracesSampleRate: 0.25,
				},
			},
			otelConfig: { serviceVersion: '2026.1.0' },
			openTelemetryIntegration,
			warn,
		});

		expect(warn).toHaveBeenCalledWith(expect.stringContaining('tracesSampleRate / tracesSampler are ignored'));
		expect(warn).toHaveBeenCalledWith(expect.stringContaining('enableNodeProfiling is ignored'));
		expect(result).not.toHaveProperty('tracesSampleRate');
	});

	// OTel併存時もSentry単体時と同じ警告経路を使うこと
	test('forwards the warn callback to the Sentry-only option checks', () => {
		const warn = vi.fn();

		buildSentryOpenTelemetryLinkedInitOptions({
			sentryConfig: {
				enableNodeProfiling: false,
				options: { sendDefaultPii: true } as Record<string, unknown>,
			},
			otelConfig: { serviceVersion: '2026.1.0' },
			openTelemetryIntegration,
			warn,
		});

		expect(warn).toHaveBeenCalledOnce();
		expect(warn.mock.calls[0][0]).toContain('sendDefaultPii');
	});
});

describe('resolveSentryOtlpExportTarget', () => {
	const target = { url: 'https://o0.ingest.sentry.io/api/1/integration/otlp/v1/traces', headers: { 'x-sentry-auth': 'sentry sentry_key=key' } };

	test('derives the OTLP target from the DSN', () => {
		const getOtlpTracesEndpoint = vi.fn(() => target);
		const warn = vi.fn();

		expect(resolveSentryOtlpExportTarget('https://key@o0.ingest.sentry.io/1', getOtlpTracesEndpoint, warn)).toEqual(target);
		expect(getOtlpTracesEndpoint).toHaveBeenCalledWith('https://key@o0.ingest.sentry.io/1');
		expect(warn).not.toHaveBeenCalled();
	});

	test('returns undefined without warning when no DSN is configured', () => {
		const getOtlpTracesEndpoint = vi.fn(() => target);
		const warn = vi.fn();

		expect(resolveSentryOtlpExportTarget(undefined, getOtlpTracesEndpoint, warn)).toBeUndefined();
		expect(resolveSentryOtlpExportTarget('', getOtlpTracesEndpoint, warn)).toBeUndefined();
		expect(getOtlpTracesEndpoint).not.toHaveBeenCalled();
		expect(warn).not.toHaveBeenCalled();
	});

	test('warns when the DSN cannot be converted', () => {
		const warn = vi.fn();

		expect(resolveSentryOtlpExportTarget('not a dsn', () => undefined, warn)).toBeUndefined();
		expect(warn).toHaveBeenCalledWith(expect.stringContaining('Sentry OTLP traces endpoint'));
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

describe('SentryTelemetryAdapter.createLinkedToOpenTelemetry', () => {
	test('initializes Sentry with openTelemetryIntegration and leaves spans and trace context to OTel', async () => {
		const init = vi.fn();
		const startSpan = vi.fn();
		const getActiveSpan = vi.fn();
		const openTelemetryIntegration = vi.fn(() => testIntegration('OpenTelemetry'));
		vi.doMock('@sentry/node', () => ({
			init,
			close: vi.fn(),
			startSpan,
			getActiveSpan,
			openTelemetryIntegration,
		}));

		const adapter = await SentryTelemetryAdapter.createLinkedToOpenTelemetry({
			enableNodeProfiling: false,
			options: {},
		}, { serviceVersion: '2026.1.0' });

		expect(init).toHaveBeenCalledOnce();
		const options = init.mock.calls[0][0];
		expect(options).not.toHaveProperty('tracesSampleRate');
		expect(options.integrations([]).map((integration: TestIntegration) => integration.name)).toEqual(['OpenTelemetry']);

		// 非記録のSentry spanでOTel spanを覆わないよう、startSpanは素通しする。
		expect(adapter.startSpan('test', () => 'result')).toBe('result');
		expect(startSpan).not.toHaveBeenCalled();
		expect(adapter.getActiveTraceContext()).toBeUndefined();
		expect(getActiveSpan).not.toHaveBeenCalled();

		vi.doUnmock('@sentry/node');
	});
});
