/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { beforeEach, describe, expect, test, vi } from 'vitest';
import { SpanStatusCode } from '@opentelemetry/api';
import { defaultResource, detectResources, envDetector, resourceFromAttributes } from '@opentelemetry/resources';
import { ParentBasedSampler, TraceIdRatioBasedSampler } from '@opentelemetry/sdk-trace-base';
import { ATTR_SERVICE_INSTANCE_ID, ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
import { OpenTelemetryAdapter, createResource, createSampler, getMisskeyProcessRole } from '@/core/telemetry/adapters/OpenTelemetryAdapter.js';

const mocks = vi.hoisted(() => {
	return {
		envOption: {
			disableClustering: false,
			onlyServer: false,
			onlyQueue: false,
		},
		isPrimary: false,
	};
});

vi.mock('@/env.js', () => ({
	envOption: mocks.envOption,
}));

vi.mock('node:cluster', () => ({
	default: {
		get isPrimary() {
			return mocks.isPrimary;
		},
	},
}));

const samplerDeps = {
	ParentBasedSampler,
	TraceIdRatioBasedSampler,
};

describe('OpenTelemetryAdapter', () => {
	test('wraps async work in an active span and ends it after success', async () => {
		const span = {
			end: vi.fn(),
			recordException: vi.fn(),
			setStatus: vi.fn(),
		};
		const tracer = {
			startActiveSpan: vi.fn(async (_name: string, fn: (spanArg: any) => Promise<string>) => fn(span)),
		} as any;
		const provider = {
			shutdown: vi.fn(),
		};
		const adapter = new OpenTelemetryAdapter({
			tracer,
			provider,
			getActiveSpan: () => undefined,
			spanStatusCodeError: SpanStatusCode.ERROR,
			shutdownTimeout: 10,
		});

		await expect(adapter.startSpan('API: test', async () => 'ok')).resolves.toBe('ok');

		expect(tracer.startActiveSpan).toHaveBeenCalledWith('API: test', expect.any(Function));
		expect(span.recordException).not.toHaveBeenCalled();
		expect(span.setStatus).not.toHaveBeenCalled();
		expect(span.end).toHaveBeenCalledTimes(1);
	});

	test('records thrown errors on the active span before rethrowing', async () => {
		const error = new Error('boom');
		const span = {
			end: vi.fn(),
			recordException: vi.fn(),
			setStatus: vi.fn(),
		};
		const tracer = {
			startActiveSpan: vi.fn(async (_name: string, fn: (spanArg: any) => Promise<void>) => fn(span)),
		} as any;
		const adapter = new OpenTelemetryAdapter({
			tracer,
			provider: { shutdown: vi.fn() },
			getActiveSpan: () => undefined,
			spanStatusCodeError: SpanStatusCode.ERROR,
			shutdownTimeout: 10,
		});

		await expect(adapter.startSpan('Queue: test', async () => {
			throw error;
		})).rejects.toThrow(error);

		expect(span.recordException).toHaveBeenCalledWith(error);
		expect(span.setStatus).toHaveBeenCalledWith({
			code: SpanStatusCode.ERROR,
			message: error.message,
		});
		expect(span.end).toHaveBeenCalledTimes(1);
	});

	test('bridges captureMessage to the active span when one exists', () => {
		const activeSpan = {
			recordException: vi.fn(),
			setStatus: vi.fn(),
		};
		const adapter = new OpenTelemetryAdapter({
			tracer: { startActiveSpan: vi.fn() },
			provider: { shutdown: vi.fn() },
			getActiveSpan: () => activeSpan as any,
			spanStatusCodeError: SpanStatusCode.ERROR,
			shutdownTimeout: 10,
		});

		adapter.captureMessage('Queue failed', {
			level: 'error',
			extra: { queue: 'deliver' },
		});

		expect(activeSpan.recordException).toHaveBeenCalledWith(expect.objectContaining({
			message: 'Queue failed',
		}));
		expect(activeSpan.setStatus).toHaveBeenCalledWith({
			code: SpanStatusCode.ERROR,
			message: 'Queue failed',
		});
	});

	test('times out shutdown instead of waiting forever', async () => {
		vi.useFakeTimers();
		const adapter = new OpenTelemetryAdapter({
			tracer: { startActiveSpan: vi.fn() },
			provider: { shutdown: vi.fn(() => new Promise<void>(() => {})) },
			getActiveSpan: () => undefined,
			spanStatusCodeError: SpanStatusCode.ERROR,
			shutdownTimeout: 50,
		});

		const shutdown = adapter.shutdown();
		await vi.advanceTimersByTimeAsync(50);

		await expect(shutdown).resolves.toBeUndefined();
		vi.useRealTimers();
	});

	test('clears the shutdown timeout timer once provider.shutdown() resolves first', async () => {
		vi.useFakeTimers();
		const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
		const adapter = new OpenTelemetryAdapter({
			tracer: { startActiveSpan: vi.fn() },
			provider: { shutdown: vi.fn().mockResolvedValue(undefined) },
			getActiveSpan: () => undefined,
			spanStatusCodeError: SpanStatusCode.ERROR,
			shutdownTimeout: 5000,
		});

		await adapter.shutdown();

		expect(clearTimeoutSpy).toHaveBeenCalled();
		clearTimeoutSpy.mockRestore();
		vi.useRealTimers();
	});

	test('captureMessage starts a standalone span to report the error when there is no active span', () => {
		const reportSpan = {
			end: vi.fn(),
			recordException: vi.fn(),
			setStatus: vi.fn(),
		};
		const tracer = {
			startActiveSpan: vi.fn((_name: string, fn: (spanArg: typeof reportSpan) => void) => fn(reportSpan)),
		};
		const adapter = new OpenTelemetryAdapter({
			tracer: tracer as any,
			provider: { shutdown: vi.fn() },
			getActiveSpan: () => undefined,
			spanStatusCodeError: SpanStatusCode.ERROR,
			shutdownTimeout: 10,
		});

		adapter.captureMessage('Queue: Deliver failed', {
			level: 'error',
			extra: { queue: 'deliver' },
		});

		expect(tracer.startActiveSpan).toHaveBeenCalledWith('captureMessage', expect.any(Function));
		expect(reportSpan.recordException).toHaveBeenCalledWith(expect.objectContaining({
			message: 'Queue: Deliver failed',
		}));
		expect(reportSpan.setStatus).toHaveBeenCalledWith({
			code: SpanStatusCode.ERROR,
			message: 'Queue: Deliver failed',
		});
		expect(reportSpan.end).toHaveBeenCalledTimes(1);
	});
});

describe('createSampler', () => {
	test('accepts sample rates within [0, 1]', () => {
		expect(() => createSampler(0, samplerDeps)).not.toThrow();
		expect(() => createSampler(0.5, samplerDeps)).not.toThrow();
		expect(() => createSampler(1, samplerDeps)).not.toThrow();
	});

	test('rejects sample rates outside [0, 1]', () => {
		expect(() => createSampler(-0.1, samplerDeps)).toThrow();
		expect(() => createSampler(1.1, samplerDeps)).toThrow();
	});

	test('rejects NaN instead of silently disabling sampling', () => {
		expect(() => createSampler(Number.NaN, samplerDeps)).toThrow();
	});

	test('rejects non-number values that pass through YAML as strings', () => {
		expect(() => createSampler('0.5' as unknown as number, samplerDeps)).toThrow();
	});
});

describe('createResource', () => {
	test('lets explicit config override OTEL resource env, and env override Misskey defaults', () => {
		const previousServiceName = process.env['OTEL_SERVICE_NAME'];
		const previousResourceAttributes = process.env['OTEL_RESOURCE_ATTRIBUTES'];
		process.env['OTEL_SERVICE_NAME'] = 'env-service';
		process.env['OTEL_RESOURCE_ATTRIBUTES'] = [
			'deployment.environment=staging',
			'misskey.process.role=env-role',
			'service.instance.id=env-instance',
			'env.only=value',
		].join(',');

		try {
			const resource = createResource({
				serviceVersion: '2026.1.0',
				resourceAttributes: {
					[ATTR_SERVICE_NAME]: 'config-service',
					'deployment.environment': 'production',
					'config.only': 'value',
				},
			}, {
				defaultResource,
				resourceFromAttributes,
				detectResources,
					envDetector,
					serviceNameAttribute: ATTR_SERVICE_NAME,
					serviceInstanceIdAttribute: ATTR_SERVICE_INSTANCE_ID,
					serviceVersionAttribute: ATTR_SERVICE_VERSION,
					serviceVersion: '2026.1.0',
				});

				expect(resource.attributes[ATTR_SERVICE_NAME]).toBe('config-service');
				expect(resource.attributes[ATTR_SERVICE_INSTANCE_ID]).toBe('env-instance');
				expect(resource.attributes[ATTR_SERVICE_VERSION]).toBe('2026.1.0');
				expect(resource.attributes['deployment.environment']).toBe('production');
			expect(resource.attributes['misskey.process.role']).toBe('env-role');
			expect(resource.attributes['env.only']).toBe('value');
			expect(resource.attributes['config.only']).toBe('value');
		} finally {
			if (previousServiceName == null) {
				delete process.env['OTEL_SERVICE_NAME'];
			} else {
				process.env['OTEL_SERVICE_NAME'] = previousServiceName;
			}
			if (previousResourceAttributes == null) {
				delete process.env['OTEL_RESOURCE_ATTRIBUTES'];
			} else {
				process.env['OTEL_RESOURCE_ATTRIBUTES'] = previousResourceAttributes;
			}
		}
	});
});

describe('getMisskeyProcessRole', () => {
	beforeEach(() => {
		mocks.envOption.disableClustering = false;
		mocks.envOption.onlyServer = false;
		mocks.envOption.onlyQueue = false;
		mocks.isPrimary = false;
	});

	test('labels non-clustered onlyServer as primary-server', () => {
		mocks.envOption.disableClustering = true;
		mocks.envOption.onlyServer = true;
		expect(getMisskeyProcessRole()).toBe('primary-server');
	});

	test('labels clustered primary with onlyServer as fork-only', () => {
		mocks.isPrimary = true;
		mocks.envOption.onlyServer = true;
		expect(getMisskeyProcessRole()).toBe('fork-only');
	});

	test('labels clustered worker running the HTTP server (onlyServer) as worker-server, not worker-queue', () => {
		mocks.isPrimary = false;
		mocks.envOption.onlyServer = true;
		expect(getMisskeyProcessRole()).toBe('worker-server');
	});

	test('labels clustered worker without onlyServer as worker-queue', () => {
		mocks.isPrimary = false;
		mocks.envOption.onlyServer = false;
		expect(getMisskeyProcessRole()).toBe('worker-queue');
	});
});
