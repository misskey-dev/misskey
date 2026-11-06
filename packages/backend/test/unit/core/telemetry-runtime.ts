/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { promisify } from 'node:util';
import { pathToFileURL } from 'node:url';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { build } from 'rolldown';
import type { RolldownOptionsFunction } from 'rolldown';
import type { RuntimeScenario, TelemetryRuntimeResult } from '../../fixtures/telemetry-runtime.js';

const exec = promisify(execFile);
let fixtureDirectory: string;

beforeAll(async () => {
	const outputRoot = resolve('built-test');
	await mkdir(outputRoot, { recursive: true });
	fixtureDirectory = await mkdtemp(join(outputRoot, 'telemetry-'));
	// Use the production bundler/external settings, including Fastify's bundled diagnostics channels.
	// Load through Node's TS support, as the CLI does, without adding build tooling to test/tsconfig.json.
	const { default: backendConfig } = await import(pathToFileURL(resolve('rolldown.config.ts')).href) as { default: RolldownOptionsFunction };
	const config = await backendConfig({});
	if (Array.isArray(config) || Array.isArray(config.output)) throw new Error('Expected a single backend bundle');
	await build({
		...config,
		input: './test/fixtures/telemetry-runtime.ts',
		output: { ...config.output, dir: fixtureDirectory },
	});
}, 30_000);

afterAll(async () => {
	if (fixtureDirectory) await rm(fixtureDirectory, { recursive: true, force: true });
});

async function run(scenario: RuntimeScenario): Promise<TelemetryRuntimeResult> {
	const { stdout, stderr } = await exec(process.execPath, [join(fixtureDirectory, 'telemetry-runtime.js'), scenario], {
		cwd: resolve('.'),
		timeout: 30_000,
		maxBuffer: 4 * 1024 * 1024,
		env: {
			...process.env,
			SENTRY_DSN: '',
			SENTRY_TRACES_SAMPLE_RATE: scenario === 'environment' ? '1' : '',
			OTEL_BSP_SCHEDULE_DELAY: '60000',
			OTEL_EXPORTER_OTLP_TIMEOUT: '60000',
		},
	});
	expect(stdout + stderr).not.toMatch(/Attempted duplicate registration|FST_ERR_DEC_ALREADY_PRESENT/);
	const line = stdout.split('\n').find(value => value.startsWith('TELEMETRY_RESULT:'));
	if (line == null) throw new Error(`Fixture did not return a result:\n${stdout}\n${stderr}`);
	return JSON.parse(line.slice('TELEMETRY_RESULT:'.length)) as TelemetryRuntimeResult;
}

function eventMessage(event: TelemetryRuntimeResult['events'][number]): string | undefined {
	return event.message ?? event.exception?.values?.[0]?.value;
}

function assertLinkedEvents(result: TelemetryRuntimeResult): void {
	for (const event of result.events) {
		const message = eventMessage(event)!;
		const id = message.startsWith('request-') ? message.slice('request-'.length) : message;
		const expected = result.contexts[id];
		const reported = result.contexts[`event:${event.event_id}`];
		expect(expected, message).toBeDefined();
		expect(expected.sentry, message).toBeUndefined();
		expect(reported.sentry, message).toBeUndefined();
		expect(event.contexts?.trace?.trace_id, message).toBe(expected.otel?.traceId);
		expect(event.contexts?.trace?.span_id, message).toBe(reported.otel?.spanId);
		expect(expected.log?.traceId, message).toBe(expected.otel?.traceId);
		expect(expected.log?.spanId, message).toBe(expected.otel?.spanId);
		expect(event.tags?.['review.filtered']).toBe(true);
	}
}

describe('telemetry with real SDKs in separate Node processes', () => {
	test.each(['none', 'sentry', 'otel', 'linked', 'disabled'] as const)('starts and routes telemetry in %s mode', async scenario => {
		const result = await run(scenario);
		expect(result.statuses).toEqual({ 'sync-error': 500, 'async-error': 500, 'hook-error': 500, 'client-error': 400, 'status-error': 503 });
		const hasSentry = scenario === 'sentry' || scenario === 'linked';
		const hasOtel = scenario === 'otel' || scenario === 'linked' || scenario === 'disabled';
		expect(result.events.map(eventMessage).sort()).toEqual(hasSentry ? ['async-error', 'hook-error', 'private-error', 'request-a', 'request-b', 'status-error', 'sync-error'] : []);
		expect(result.requests.some(request => request.path === '/v1/traces')).toBe(hasOtel);
		expect(result.requests.some(request => request.path.includes('/integration/otlp/'))).toBe(false);
		if (scenario === 'sentry') {
			expect(result.integrations).toContain('ProfilingIntegration');
			expect(result.itemTypes).toContain('span');
		} else {
			expect(result.itemTypes).not.toContain('span');
			expect(result.itemTypes).not.toContain('transaction');
		}
		if (scenario === 'disabled') expect(result.requests.some(request => request.path.includes('/envelope/'))).toBe(false);
		if (scenario === 'linked') {
			assertLinkedEvents(result);
			for (const id of ['a', 'b']) {
				const event = result.events.find(value => value.message === `request-${id}`)!;
				expect(event.tags?.['review.id']).toBe(id);
				expect(event.user).toEqual({ id });
				expect(event.request?.query_string).toBeUndefined();
				expect(event.request?.data).toBeUndefined();
			}
			for (const request of result.requests.filter(value => value.path.startsWith('/outbound') || value.path.startsWith('/fetch'))) {
				for (const header of ['sentry-trace', 'baggage', 'traceparent']) expect(request.headers[header]).toBeUndefined();
			}
			const otlp = result.requests.filter(value => value.path === '/v1/traces').map(value => value.body).join('');
			expect(otlp).not.toContain('private-token');
			expect(otlp).not.toContain('private-note-content');
			expect(JSON.stringify(result.events)).not.toContain('private-token');
			expect(JSON.stringify(result.events)).not.toContain('private-note-content');
		}
	}, 30_000);

	test('keeps OTel ownership despite Sentry environment variables and competing options', async () => {
		const result = await run('environment');
		expect(result.environment).toBe('1');
		expect(result.events).toHaveLength(7);
		assertLinkedEvents(result);
		expect(result.itemTypes).not.toContain('span');
	}, 30_000);

	test('links errors even when OTel drops unsampled traces', async () => {
		const result = await run('unsampled');
		expect(result.events).toHaveLength(7);
		assertLinkedEvents(result);
		expect(result.contexts.a.otel?.traceFlags).toBe(0);
		expect(result.requests.some(request => request.path === '/v1/traces')).toBe(false);
	}, 30_000);

	test.each(['queue-parent', 'queue-link'] as const)('isolates concurrent jobs and retries in %s mode', async scenario => {
		const result = await run(scenario);
		assertLinkedEvents(result);
		for (const id of ['job-a', 'job-b']) {
			for (const attempt of [0, 1]) {
				const event = result.events.find(value => value.message === `${id}-${attempt}`)!;
				expect(event.tags?.['review.id']).toBe(id);
				expect(event.user).toEqual({ id });
				const context = result.contexts[`${id}-${attempt}`];
				if (scenario === 'queue-parent') {
					expect(context.otel?.traceId).toBe(result.contexts.enqueue.otel?.traceId);
					expect(context.parent?.spanId).toBe(result.contexts.enqueue.otel?.spanId);
				} else {
					expect(context.otel?.traceId).not.toBe(result.contexts.enqueue.otel?.traceId);
					expect(context.links?.[0].spanId).toBe(result.contexts.enqueue.otel?.spanId);
				}
			}
		}
		const legacy = result.events.find(event => event.message === 'legacy')!;
		expect(legacy.tags?.['review.id']).toBeUndefined();
		expect(legacy.user).toBeUndefined();
	}, 30_000);

	test('respects explicitly disabled Fastify error capture', async () => {
		const result = await run('fastify-disabled');
		expect(result.events.map(eventMessage).sort()).toEqual(['request-a', 'request-b']);
		assertLinkedEvents(result);
	}, 30_000);

	test('does not reinstall explicitly disabled HTTP and fetch integrations', async () => {
		const result = await run('http-disabled');
		expect(result.integrations).not.toContain('Http');
		expect(result.integrations).not.toContain('NodeFetch');
	}, 30_000);

	test.each(['sentry-defaults-false', 'sentry-defaults-empty', 'linked-defaults-false', 'linked-defaults-empty'] as const)('respects explicit default integration opt-out in %s mode', async scenario => {
		const result = await run(scenario);
		expect(result.events.map(eventMessage).sort()).toEqual(['request-a', 'request-b']);
		for (const name of ['Http', 'NodeFetch', 'Fastify', 'OnUncaughtException', 'OnUnhandledRejection']) {
			expect(result.integrations).not.toContain(name);
		}
	}, 30_000);

	test('preserves selected default error integrations while removing Sentry tracing', async () => {
		const result = await run('linked-defaults-selected');
		expect(result.events).toHaveLength(7);
		assertLinkedEvents(result);
		for (const event of result.events) expect(event.tags?.['review.selected']).toBe(true);
		expect(result.integrations).not.toContain('Postgres');
		expect(result.integrations).not.toContain('OnUncaughtException');
		expect(result.itemTypes).not.toContain('span');
	}, 30_000);

	test('disables profiling in linked mode while continuing to capture errors', async () => {
		const result = await run('profile');
		expect(result.integrations).not.toContain('ProfilingIntegration');
		expect(result.events).toHaveLength(7);
		assertLinkedEvents(result);
	}, 30_000);

	test('bounds shutdown when both destinations stop responding', async () => {
		const result = await run('stalled');
		expect(result.shutdownMs).toBeLessThan(20_000);
		expect(result.requests.some(request => request.path === '/v1/traces')).toBe(true);
		expect(result.requests.some(request => request.path.includes('/envelope/'))).toBe(true);
	}, 30_000);
});
