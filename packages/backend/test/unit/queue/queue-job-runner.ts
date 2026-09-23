/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test, vi } from 'vitest';
import { runQueueJobWithTraceContext } from '@/queue/queue-job-runner.js';
import { TelemetryService } from '@/core/telemetry/TelemetryService.js';

describe('runQueueJobWithTraceContext', () => {
	test('returns the processor result without invoking the error handler', async () => {
		let spanActive = false;
		const startSpanWithTraceContext = vi.fn(<T>(_name: string, _jobData: object, fn: () => T): T => {
			spanActive = true;
			const result = fn();
			if (result instanceof Promise) return result.finally(() => { spanActive = false; }) as T;
			spanActive = false;
			return result;
		});
		const telemetryService = {
			startSpanWithTraceContext,
		} as unknown as TelemetryService;
		const onError = vi.fn();

		await expect(runQueueJobWithTraceContext(telemetryService, 'Queue: test', {}, () => 'ok', onError)).resolves.toBe('ok');

		expect(onError).not.toHaveBeenCalled();
		expect(spanActive).toBe(false);
	});

	test('handles failures while the processor span is active and rethrows the original error', async () => {
		let spanActive = false;
		const startSpanWithTraceContext = vi.fn(<T>(_name: string, _jobData: object, fn: () => T): T => {
			spanActive = true;
			const result = fn();
			if (result instanceof Promise) return result.finally(() => { spanActive = false; }) as T;
			spanActive = false;
			return result;
		});
		const telemetryService = {
			startSpanWithTraceContext,
		} as unknown as TelemetryService;
		const onError = vi.fn((error: Error) => {
			expect(spanActive).toBe(true);
			expect(error).toBeInstanceOf(Error);
		});
		const originalError = new Error('failed');

		await expect(runQueueJobWithTraceContext(telemetryService, 'Queue: test', {}, async () => {
			throw originalError;
		}, onError)).rejects.toBe(originalError);

		expect(onError).toHaveBeenCalledOnce();
		expect(spanActive).toBe(false);
	});
});
