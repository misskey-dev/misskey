/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createRequire } from 'node:module';
import { context, propagation, trace } from '@opentelemetry/api';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { describe, expect, test, vi } from 'vitest';
import type { Span as SdkSpan, SpanProcessor } from '@opentelemetry/sdk-trace-base';
import { installDatabaseInstrumentation, installInstrumentation } from '@/core/telemetry/database-instrumentation.js';

const backendRequire = createRequire(import.meta.url);

describe('database-instrumentation', () => {
	test('does not install PostgreSQL instrumentation when disabled', async () => {
		const uninstall = await installDatabaseInstrumentation({} as any, {
			capturePgSpans: false,
			capturePgStatement: false,
			capturePgConnectionSpans: false,
		});

		expect(uninstall).toBeTypeOf('function');
		expect(() => uninstall()).not.toThrow();
	});

	test('registers pg instrumentation with the active provider', () => {
		const provider = {};
		const pg = { setTracerProvider: vi.fn(), enable: vi.fn(), disable: vi.fn() };
		const config = vi.fn();
		const PgInstrumentation = class {
			public constructor(options: unknown) {
				config(options);
				return pg as any;
			}
		};

		const uninstall = installInstrumentation(provider as any, {
			PgInstrumentation: PgInstrumentation as any,
		}, {
			capturePgStatement: false,
			capturePgConnectionSpans: false,
		});

		expect(pg.setTracerProvider).toHaveBeenCalledWith(provider);
		expect(pg.enable).toHaveBeenCalledOnce();
		expect(config).toHaveBeenCalledWith(expect.objectContaining({
			enhancedDatabaseReporting: false,
			requireParentSpan: true,
			ignoreConnectSpans: true,
			requestHook: expect.any(Function),
		}));

		const span = { setAttribute: vi.fn() };
		(config.mock.calls[0][0] as { requestHook: (span: any) => void }).requestHook(span);
		expect(span.setAttribute).toHaveBeenCalledWith('db.statement', '[REDACTED]');
		expect(span.setAttribute).toHaveBeenCalledWith('db.query.text', '[REDACTED]');

		uninstall();

		expect(pg.disable).toHaveBeenCalledOnce();
	});

	test('redacts SQL attributes after pg instrumentation records the statement', async () => {
		const statement = 'SELECT very_secret_literal';
		const attributeWrites: Array<{ key: string; value: unknown }> = [];
		let attributesAtStart: Record<string, unknown> | undefined;
		let pgSpan: SdkSpan | undefined;
		const spanProcessor: SpanProcessor = {
			forceFlush: async () => {},
			onStart: span => {
				if (span.instrumentationScope.name !== '@opentelemetry/instrumentation-pg') return;

				pgSpan = span;
				attributesAtStart = { ...span.attributes };
				const setAttribute = span.setAttribute.bind(span);
				span.setAttribute = (key, value) => {
					attributeWrites.push({ key, value });
					return setAttribute(key, value);
				};
			},
			onEnd: () => {},
			shutdown: async () => {},
		};
		const provider = new NodeTracerProvider({ spanProcessors: [spanProcessor] });
		provider.register();
		let uninstall: (() => void) | undefined;

		try {
			uninstall = await installDatabaseInstrumentation(provider, {
				capturePgSpans: true,
				capturePgStatement: false,
				capturePgConnectionSpans: false,
			});
			const { Client } = backendRequire('pg') as typeof import('pg');
			const tracer = provider.getTracer('database-instrumentation-test');

			tracer.startActiveSpan('parent', parentSpan => {
				try {
					// pg instrumentation runs before an unconnected client queues the query,
					// so no database is required.
					new Client().query(statement, () => {});
				} finally {
					parentSpan.end();
				}
			});

			const recordedPgSpan = pgSpan;
			expect(recordedPgSpan).toBeDefined();
			if (recordedPgSpan == null) throw new Error('PostgreSQL span was not started.');
			expect(attributesAtStart).not.toHaveProperty('db.statement');
			expect(attributesAtStart).not.toHaveProperty('db.query.text');

			const rawSqlIndex = attributeWrites.findIndex(({ key, value }) =>
				(key === 'db.statement' || key === 'db.query.text') && value === statement);
			expect(rawSqlIndex).toBeGreaterThanOrEqual(0);
			const rawSqlKey = attributeWrites[rawSqlIndex].key;
			expect(attributeWrites.findIndex(({ key, value }, index) =>
				index > rawSqlIndex && key === rawSqlKey && value === '[REDACTED]')).toBeGreaterThan(rawSqlIndex);

			expect(recordedPgSpan.attributes['db.statement']).toBe('[REDACTED]');
			expect(recordedPgSpan.attributes['db.query.text']).toBe('[REDACTED]');
			expect(Object.values(recordedPgSpan.attributes)).not.toContain(statement);
		} finally {
			pgSpan?.end();
			uninstall?.();
			await provider.shutdown();
			trace.disable();
			context.disable();
			propagation.disable();
		}
	});

	test('keeps SQL statement attributes when explicitly enabled', () => {
		const pg = { setTracerProvider: vi.fn(), enable: vi.fn(), disable: vi.fn() };
		const config = vi.fn();

		installInstrumentation({} as any, {
			PgInstrumentation: class {
				public constructor(options: unknown) {
					config(options);
					return pg as any;
				}
			} as any,
		}, {
			capturePgStatement: true,
			capturePgConnectionSpans: false,
		});

		expect(config.mock.calls[0][0]).not.toHaveProperty('requestHook');
	});

	test('enables connection spans when explicitly configured', () => {
		const pg = { setTracerProvider: vi.fn(), enable: vi.fn(), disable: vi.fn() };
		const config = vi.fn();

		installInstrumentation({} as any, {
			PgInstrumentation: class {
				public constructor(options: unknown) {
					config(options);
					return pg as any;
				}
			} as any,
		}, {
			capturePgStatement: false,
			capturePgConnectionSpans: true,
		});

		expect(config).toHaveBeenCalledWith(expect.objectContaining({
			ignoreConnectSpans: false,
		}));
	});

	test('cleans up the pg instrumentation when initialization fails', () => {
		const pg = { setTracerProvider: vi.fn(), enable: vi.fn(), disable: vi.fn() };
		pg.enable.mockImplementation(() => { throw new Error('failed'); });

		expect(() => installInstrumentation({} as any, {
			PgInstrumentation: class { public constructor() { return pg as any; } } as any,
		})).toThrow('failed');

		expect(pg.disable).toHaveBeenCalledOnce();
	});
});
