/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test, vi } from 'vitest';
import { installDatabaseInstrumentation, installInstrumentation } from '@/core/telemetry/database-instrumentation.js';

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

	test('cleans up both instrumentations when initialization fails', () => {
		const pg = { setTracerProvider: vi.fn(), enable: vi.fn(), disable: vi.fn() };
		pg.enable.mockImplementation(() => { throw new Error('failed'); });

		expect(() => installInstrumentation({} as any, {
			PgInstrumentation: class { public constructor() { return pg as any; } } as any,
		})).toThrow('failed');

		expect(pg.disable).toHaveBeenCalledOnce();
	});
});
