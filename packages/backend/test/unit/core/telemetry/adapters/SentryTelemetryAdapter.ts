/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { afterEach, describe, expect, test, vi } from 'vitest';
import { SentryTelemetryAdapter, buildSentryIntegrations, buildSentryNodeOptions, buildSentryOtlpInitOptions, resolveSentryAutoInstrumentationExport } from '@/core/telemetry/adapters/SentryTelemetryAdapter.js';

type TestIntegration = Parameters<ReturnType<typeof buildSentryIntegrations>>[0][number];

function testIntegration(name: string): TestIntegration {
	return { name };
}

describe('SentryTelemetryAdapter', () => {
	test('removes only explicitly disabled integrations from Sentry defaults', () => {
		const defaults = [
			testIntegration('Http'),
			testIntegration('Postgres'),
			testIntegration('Redis'),
		];
		expect(buildSentryIntegrations({ enableNodeProfiling: false })(defaults).map((integration: TestIntegration) => integration.name)).toEqual(['Http', 'Postgres', 'Redis']);
		const integrations = buildSentryIntegrations({
			disabledIntegrations: ['Postgres'],
			enableNodeProfiling: false,
		});

		const result = integrations(defaults);
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

	test('does not force-disable any integration absent operator configuration', () => {
		// 運用者が明示しない限り、Sentry 既定の integration を無効化しない。
		const options = buildSentryNodeOptions({ enableNodeProfiling: false, options: {} });
		const result = (options.integrations as any)([
			testIntegration('Http'),
			testIntegration('RequestData'),
		]);
		expect(result.map((integration: TestIntegration) => integration.name)).toEqual(['Http', 'RequestData']);
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

	test('passes operator options through to Sentry.init() untouched (Sentry-side sanitization was removed; Sentry backend support is a released feature)', () => {
		const options = buildSentryNodeOptions({
			enableNodeProfiling: false,
			options: {
				dsn: 'https://examplePublicKey@o0.ingest.sentry.io/0',
				tracesSampleRate: 0.5,
			},
		});

		expect(options.dsn).toBe('https://examplePublicKey@o0.ingest.sentry.io/0');
		expect(options.tracesSampleRate).toBe(0.5);
	});

	test('builds Sentry options that export spans to both Sentry and OTLP', () => {
		const otlpProcessor = { name: 'otlpProcessor' };

		const result = buildSentryOtlpInitOptions({
			sentryConfig: {
				enableNodeProfiling: false,
				options: { tracesSampleRate: 0.25 },
			},
			otelConfig: { serviceVersion: '2026.1.0' },
			otlpProcessor,
		});

		expect(result.tracesSampleRate).toBe(0.25);
		expect(result.openTelemetrySpanProcessors).toEqual([otlpProcessor]);
		// OTel併存時もremoteへtrace headerを漏らさないデフォルトはSentry単体時と揃える。
		expect(result.tracePropagationTargets).toEqual([]);
	});

	test('keeps operator-configured sentryForBackend.options.openTelemetrySpanProcessors instead of silently discarding them', () => {
		// OTLP 用 processor の追加時も、運用者が登録した processor を保持する。
		const operatorProcessor = { name: 'operatorProcessor' };
		const otlpProcessor = { name: 'otlpProcessor' };

		const result = buildSentryOtlpInitOptions({
			sentryConfig: {
				enableNodeProfiling: false,
				options: { openTelemetrySpanProcessors: [operatorProcessor as never] },
			},
			otelConfig: { serviceVersion: '2026.1.0' },
			otlpProcessor,
		});

		expect(result.openTelemetrySpanProcessors).toEqual([operatorProcessor, otlpProcessor]);
	});

	test('keeps Sentry database integrations authoritative when OTLP capture flags are enabled; OTLP re-export is a separate gate', () => {
		const result = buildSentryOtlpInitOptions({
			sentryConfig: {
				enableNodeProfiling: false,
				options: {},
			},
			otelConfig: {
				serviceVersion: '2026.1.0',
				capturePgSpans: true,
				capturePgConnectionSpans: true,
				captureRedisCommandSpans: true,
				captureRedisConnectionSpans: true,
			},
			otlpProcessor: {},
		});

		// capture* は OTLP への再出力だけを制御し、Sentry 自身の自動計装には影響しない。
		expect((result.integrations as any)([
			testIntegration('Http'),
			testIntegration('Postgres'),
			testIntegration('Redis'),
		]).map((integration: TestIntegration) => integration.name)).toEqual(['Http', 'Postgres', 'Redis']);
		expect(result.openTelemetrySpanProcessors).toHaveLength(1);
	});

	describe('tracePropagationTargets option-resolution matrix', () => {
		// trace header の送信先を明示せずに全 outbound host へ伝播させないことを確認する。

		test('propagateTraceToRemote: true without explicit tracePropagationTargets throws at startup instead of silently propagating to every host', () => {
			expect(() => buildSentryOtlpInitOptions({
				sentryConfig: {
					enableNodeProfiling: false,
					options: {},
				},
				otelConfig: {
					serviceVersion: '2026.1.0',
					propagateTraceToRemote: true,
				},
				otlpProcessor: { name: 'otlpProcessor' },
			})).toThrow('otelForBackend.propagateTraceToRemote');
		});

		test('propagateTraceToRemote: true with explicit tracePropagationTargets is honored without throwing', () => {
			const result = buildSentryOtlpInitOptions({
				sentryConfig: {
					enableNodeProfiling: false,
					options: {
						tracePropagationTargets: ['^https://internal\\.example/'],
					},
				},
				otelConfig: {
					serviceVersion: '2026.1.0',
					propagateTraceToRemote: true,
				},
				otlpProcessor: { name: 'otlpProcessor' },
			});

			expect(result.tracePropagationTargets).toEqual(['^https://internal\\.example/']);
		});

		test('honors explicit tracePropagationTargets for OTel coexistence even without propagateTraceToRemote', () => {
			const result = buildSentryOtlpInitOptions({
				sentryConfig: {
					enableNodeProfiling: false,
					options: {
						tracePropagationTargets: ['^https://internal\\.example/'],
					},
				},
				otelConfig: { serviceVersion: '2026.1.0' },
				otlpProcessor: { name: 'otlpProcessor' },
			});

			expect(result.tracePropagationTargets).toEqual(['^https://internal\\.example/']);
		});

		test('propagateTraceToRemote unset and tracePropagationTargets unset keeps the safe empty-array default', () => {
			const result = buildSentryOtlpInitOptions({
				sentryConfig: {
					enableNodeProfiling: false,
					options: {},
				},
				otelConfig: { serviceVersion: '2026.1.0' },
				otlpProcessor: { name: 'otlpProcessor' },
			});

			expect(result.tracePropagationTargets).toEqual([]);
		});
	});

	test('warns when OTel-only options are ignored in Sentry coexistence mode', () => {
		const warn = vi.fn();

		buildSentryOtlpInitOptions({
			sentryConfig: {
				enableNodeProfiling: false,
				options: {},
			},
			otelConfig: {
				serviceVersion: '2026.1.0',
				sampleRate: 0.25,
				resourceAttributes: {
					'deployment.environment': 'production',
				},
			},
			otlpProcessor: { name: 'otlpProcessor' },
			warn,
		});

		expect(warn).toHaveBeenCalledWith(expect.stringContaining('otelForBackend.sampleRate is ignored'));
		expect(warn).toHaveBeenCalledWith(expect.stringContaining('otelForBackend.resourceAttributes is ignored'));
	});
});

describe('resolveSentryAutoInstrumentationExport', () => {
	test('defaults unset to none', () => {
		expect(resolveSentryAutoInstrumentationExport(undefined)).toBe('none');
	});

	test('accepts the documented values as-is', () => {
		expect(resolveSentryAutoInstrumentationExport('none')).toBe('none');
		expect(resolveSentryAutoInstrumentationExport('safe')).toBe('safe');
	});

	test('fails fast on typos and unsupported values instead of silently falling back to none', () => {
		for (const invalid of ['Safe', 'all', 0, true, {}]) {
			expect(() => resolveSentryAutoInstrumentationExport(invalid)).toThrow('otelForBackend.sentryAutoInstrumentationExport');
		}
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

describe('SentryTelemetryAdapter.createWithOtlpExport', () => {
	test('registers the OTel diag logger before creating the OTLP exporter', async () => {
		const init = vi.fn();
		const close = vi.fn();
		const setLogger = vi.fn();
		const nodeProfilingIntegration = vi.fn();
		const BatchSpanProcessor = vi.fn(function (this: { exporter: unknown }, exporter: unknown) {
			this.exporter = exporter;
		});
		const OTLPTraceExporter = vi.fn(function (this: { options: unknown }, options: unknown) {
			this.options = options;
		});

		vi.doMock('@sentry/node', () => ({
			init,
			close,
		}));
		vi.doMock('@sentry/profiling-node', () => ({
			nodeProfilingIntegration,
		}));
		vi.doMock('@opentelemetry/api', () => ({
			context: { active: vi.fn() },
			diag: { setLogger },
			DiagLogLevel: { WARN: 50 },
			propagation: { inject: vi.fn(), extract: vi.fn() },
			ROOT_CONTEXT: {},
			SpanStatusCode: { ERROR: 2 },
			trace: { getTracer: vi.fn(), getSpanContext: vi.fn() },
		}));
		vi.doMock('@opentelemetry/sdk-trace-base', () => ({
			BatchSpanProcessor,
		}));
		vi.doMock('@opentelemetry/exporter-trace-otlp-proto', () => ({
			OTLPTraceExporter,
		}));

		await SentryTelemetryAdapter.createWithOtlpExport({
			enableNodeProfiling: false,
			options: {},
		}, {
			serviceVersion: '2026.1.0',
			endpoint: 'http://collector:4318/v1/traces',
		});

		expect(setLogger).toHaveBeenCalledWith(expect.objectContaining({
			error: expect.any(Function),
			warn: expect.any(Function),
		}), {
			logLevel: 50,
			suppressOverrideMessage: true,
		});
		expect(OTLPTraceExporter).toHaveBeenCalledWith({
			url: 'http://collector:4318/v1/traces',
		});
		expect(init).toHaveBeenCalledWith(expect.objectContaining({
			openTelemetrySpanProcessors: [expect.any(Object)],
		}));

		vi.doUnmock('@sentry/node');
		vi.doUnmock('@sentry/profiling-node');
		vi.doUnmock('@opentelemetry/api');
		vi.doUnmock('@opentelemetry/sdk-trace-base');
		vi.doUnmock('@opentelemetry/exporter-trace-otlp-proto');
	});

	test('passes otelForBackend.capturePgStatement only to the OTLP-only SanitizingSpanProcessor', async () => {
		const init = vi.fn();
		const close = vi.fn();
		const nodeProfilingIntegration = vi.fn();
		const sanitizingSpanProcessorArgs: unknown[][] = [];
		class FakeSanitizingSpanProcessor {
			public constructor(...args: unknown[]) {
				sanitizingSpanProcessorArgs.push(args);
			}
		}
		const BatchSpanProcessor = vi.fn(function (this: { exporter: unknown }, exporter: unknown) {
			this.exporter = exporter;
		});
		const OTLPTraceExporter = vi.fn(function (this: { options: unknown }, options: unknown) {
			this.options = options;
		});

		vi.doMock('@sentry/node', () => ({ init, close }));
		vi.doMock('@sentry/profiling-node', () => ({ nodeProfilingIntegration }));
		vi.doMock('@opentelemetry/api', () => ({
			context: { active: vi.fn() },
			diag: { setLogger: vi.fn() },
			DiagLogLevel: { WARN: 50 },
			propagation: { inject: vi.fn(), extract: vi.fn() },
			ROOT_CONTEXT: {},
			SpanStatusCode: { ERROR: 2 },
			trace: { getTracer: vi.fn(), getSpanContext: vi.fn() },
		}));
		vi.doMock('@opentelemetry/sdk-trace-base', () => ({ BatchSpanProcessor }));
		vi.doMock('@opentelemetry/exporter-trace-otlp-proto', () => ({ OTLPTraceExporter }));
		// export 判定は実装のまま使い、processor の生成引数だけを差し替えて観測する。
		vi.doMock('@/core/telemetry/SanitizingSpanProcessor.js', async (importOriginal) => {
			const actual = await importOriginal<typeof import('@/core/telemetry/SanitizingSpanProcessor.js')>();
			return { ...actual, SanitizingSpanProcessor: FakeSanitizingSpanProcessor };
		});

		// 静的 import 済みの依存を差し替えるため、モジュールキャッシュを破棄して再 import する。
		vi.resetModules();
		const { SentryTelemetryAdapter: MockedSentryTelemetryAdapter } = await import('@/core/telemetry/adapters/SentryTelemetryAdapter.js');

		try {
			await MockedSentryTelemetryAdapter.createWithOtlpExport({
				enableNodeProfiling: false,
				options: {},
			}, {
				serviceVersion: '2026.1.0',
				capturePgStatement: true,
			});

			// `capturePgStatement` が OTLP 用 processor の属性ポリシーだけに渡ることを確認する。
			// Sentry 自身の PostgreSQL 計装と送信は、このポリシーを参照しない。
			expect(sanitizingSpanProcessorArgs).toHaveLength(1);
			expect(sanitizingSpanProcessorArgs[0][2]).toEqual({ allowDbStatement: true });
		} finally {
			// assertion が失敗しても module mock を後続テストへ持ち越さない。
			vi.doUnmock('@sentry/node');
			vi.doUnmock('@sentry/profiling-node');
			vi.doUnmock('@opentelemetry/api');
			vi.doUnmock('@opentelemetry/sdk-trace-base');
			vi.doUnmock('@opentelemetry/exporter-trace-otlp-proto');
			vi.doUnmock('@/core/telemetry/SanitizingSpanProcessor.js');
			vi.resetModules();
		}
	});
});

// combined 構成では例外を OTLP の span event に残すため、共有 OTel provider の tracer を使う。
// Sentry 単体構成では Sentry.startSpan を使う。
describe('SentryTelemetryAdapter.startSpan', () => {
	type FakeSpan = {
		end: ReturnType<typeof vi.fn>;
		recordException: ReturnType<typeof vi.fn>;
		setStatus: ReturnType<typeof vi.fn>;
		setAttribute: ReturnType<typeof vi.fn>;
	};

	function createFakeSpan(): FakeSpan {
		return { end: vi.fn(), recordException: vi.fn(), setStatus: vi.fn(), setAttribute: vi.fn() };
	}

	async function createCombinedAdapter(span: FakeSpan) {
		const startActiveSpan = vi.fn((_name: string, fn: (s: FakeSpan) => unknown) => fn(span));
		const startSpan = vi.fn();
		vi.doMock('@sentry/node', () => ({ init: vi.fn(), close: vi.fn(), startSpan }));
		vi.doMock('@sentry/profiling-node', () => ({ nodeProfilingIntegration: vi.fn() }));
		vi.doMock('@opentelemetry/api', () => ({
			context: { active: vi.fn() },
			diag: { setLogger: vi.fn() },
			DiagLogLevel: { WARN: 50 },
			propagation: { inject: vi.fn(), extract: vi.fn() },
			ROOT_CONTEXT: {},
			SpanStatusCode: { ERROR: 2 },
			trace: { getTracer: vi.fn(() => ({ startActiveSpan })), getSpanContext: vi.fn() },
		}));
		vi.doMock('@opentelemetry/sdk-trace-base', () => ({ BatchSpanProcessor: vi.fn() }));
		vi.doMock('@opentelemetry/exporter-trace-otlp-proto', () => ({ OTLPTraceExporter: vi.fn() }));

		const adapter = await SentryTelemetryAdapter.createWithOtlpExport({
			enableNodeProfiling: false,
			options: {},
		}, { serviceVersion: '2026.1.0' });

		return { adapter, startActiveSpan, sentryStartSpan: startSpan };
	}

	// assertion が失敗したテストでも module mock を後続テストへ持ち越さないよう、解除は afterEach で行う。
	afterEach(() => {
		vi.doUnmock('@sentry/node');
		vi.doUnmock('@sentry/profiling-node');
		vi.doUnmock('@opentelemetry/api');
		vi.doUnmock('@opentelemetry/sdk-trace-base');
		vi.doUnmock('@opentelemetry/exporter-trace-otlp-proto');
	});

	test('combined: uses the OTel tracer (not Sentry.startSpan) and ends the span on success', async () => {
		const span = createFakeSpan();
		const { adapter, startActiveSpan, sentryStartSpan } = await createCombinedAdapter(span);

		expect(adapter.startSpan('API: notes/show', () => 'result')).toBe('result');
		expect(startActiveSpan).toHaveBeenCalledWith('API: notes/show', expect.any(Function));
		expect(sentryStartSpan).not.toHaveBeenCalled();
		expect(span.end).toHaveBeenCalledTimes(1);
		expect(span.recordException).not.toHaveBeenCalled();
		expect(span.setStatus).not.toHaveBeenCalled();
	});

	test('combined: records a synchronous throw as an exception event with ERROR status, ends the span, and rethrows', async () => {
		const span = createFakeSpan();
		const { adapter } = await createCombinedAdapter(span);
		const error = new Error('boom');

		expect(() => adapter.startSpan('API: notes/show', () => { throw error; })).toThrow(error);
		expect(span.recordException).toHaveBeenCalledTimes(1);
		expect(span.setStatus).toHaveBeenCalledWith(expect.objectContaining({ code: 2 }));
		expect(span.end).toHaveBeenCalledTimes(1);
	});

	test('combined: records a rejected promise the same way and keeps the rejection observable to the caller', async () => {
		const span = createFakeSpan();
		const { adapter } = await createCombinedAdapter(span);
		const error = new Error('async boom');

		await expect(adapter.startSpan('API: notes/show', () => Promise.reject(error))).rejects.toBe(error);
		expect(span.recordException).toHaveBeenCalledTimes(1);
		expect(span.setStatus).toHaveBeenCalledWith(expect.objectContaining({ code: 2 }));
		expect(span.end).toHaveBeenCalledTimes(1);
	});

	test('combined: does not end the span before an async fn settles', async () => {
		const span = createFakeSpan();
		const { adapter } = await createCombinedAdapter(span);
		let settle: (() => void) | undefined;
		const pending = adapter.startSpan('API: notes/show', () => new Promise<void>((resolve) => { settle = resolve; }));

		expect(span.end).not.toHaveBeenCalled();
		settle?.();
		await pending;
		expect(span.end).toHaveBeenCalledTimes(1);
	});

	test('Sentry-only: keeps using Sentry.startSpan (no OTel provider exists in this configuration)', async () => {
		const startSpan = vi.fn((_options: { name: string }, fn: () => unknown) => fn());
		vi.doMock('@sentry/node', () => ({ init: vi.fn(), close: vi.fn(), startSpan }));
		vi.doMock('@sentry/profiling-node', () => ({ nodeProfilingIntegration: vi.fn() }));

		const adapter = await SentryTelemetryAdapter.create({ enableNodeProfiling: false, options: {} });

		expect(adapter.startSpan('API: notes/show', () => 'result')).toBe('result');
		expect(startSpan).toHaveBeenCalledWith({ name: 'API: notes/show' }, expect.any(Function));
	});
});
