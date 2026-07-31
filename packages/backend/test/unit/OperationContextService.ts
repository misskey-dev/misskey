/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { setImmediate } from 'node:timers/promises';
import { describe, expect, test, vi } from 'vitest';
import { defineOperationMemo, OperationContextService } from '@/core/OperationContextService.js';

describe('OperationContextService', () => {
	test('coalesces concurrent loads for the same token and key', async () => {
		const service = new OperationContextService();
		const token = defineOperationMemo<string, object>('test', key => key);
		const loader = vi.fn(async () => {
			await setImmediate();
			return {};
		});

		const [first, second] = await service.runRoot(() => Promise.all([
			service.memoizeIfActive(token, 'key', loader),
			service.memoizeIfActive(token, 'key', loader),
		]));

		expect(first).toBe(second);
		expect(loader).toHaveBeenCalledOnce();
	});

	test('does not share values between root operations', async () => {
		const service = new OperationContextService();
		const token = defineOperationMemo<string, object>('test', key => key);
		const loader = vi.fn(async () => {
			await setImmediate();
			return {};
		});

		const [first, second] = await Promise.all([
			service.runRoot(() => service.memoizeIfActive(token, 'key', loader)),
			service.runRoot(() => service.memoizeIfActive(token, 'key', loader)),
		]);

		expect(first).not.toBe(second);
		expect(loader).toHaveBeenCalledTimes(2);
	});

	test('nested root operations restore the parent context', async () => {
		const service = new OperationContextService();
		const token = defineOperationMemo<string, object>('test', key => key);
		const loader = vi.fn(() => ({}));

		await service.runRoot(async () => {
			const outer = await service.memoizeIfActive(token, 'key', loader);
			const inner = await service.runRoot(() => service.memoizeIfActive(token, 'key', loader));

			expect(inner).not.toBe(outer);
			await expect(service.memoizeIfActive(token, 'key', loader)).resolves.toBe(outer);
		});

		expect(loader).toHaveBeenCalledTimes(2);
	});

	test('falls back to loading every time outside an operation context', async () => {
		const service = new OperationContextService();
		const token = defineOperationMemo<string, object>('test', key => key);
		const loader = vi.fn(() => ({}));

		const first = await service.memoizeIfActive(token, 'key', loader);
		const second = await service.memoizeIfActive(token, 'key', loader);

		expect(first).not.toBe(second);
		expect(loader).toHaveBeenCalledTimes(2);
	});

	test('keeps rejected loads stable for the duration of the operation', async () => {
		const service = new OperationContextService();
		const token = defineOperationMemo<string, never>('test', key => key);
		const error = new Error('failed');
		const loader = vi.fn(() => Promise.reject(error));

		await service.runRoot(async () => {
			await expect(service.memoizeIfActive(token, 'key', loader)).rejects.toBe(error);
			await expect(service.memoizeIfActive(token, 'key', loader)).rejects.toBe(error);
		});

		expect(loader).toHaveBeenCalledOnce();
	});

	test('can invalidate one memoized key after a write', async () => {
		const service = new OperationContextService();
		const token = defineOperationMemo<string, number>('test', key => key);
		let value = 1;
		const loader = vi.fn(() => value);

		await service.runRoot(async () => {
			await expect(service.memoizeIfActive(token, 'a', loader)).resolves.toBe(1);
			await expect(service.memoizeIfActive(token, 'b', loader)).resolves.toBe(1);

			value = 2;
			service.invalidateIfActive(token, 'a');

			await expect(service.memoizeIfActive(token, 'a', loader)).resolves.toBe(2);
			await expect(service.memoizeIfActive(token, 'b', loader)).resolves.toBe(1);
		});
	});

	test('can invalidate every key for a memo token after a write', async () => {
		const service = new OperationContextService();
		const token = defineOperationMemo<string, number>('test', key => key);
		let value = 1;
		const loader = vi.fn(() => value);

		await service.runRoot(async () => {
			await service.memoizeIfActive(token, 'a', loader);
			await service.memoizeIfActive(token, 'b', loader);

			value = 2;
			service.invalidateAllIfActive(token);

			await expect(service.memoizeIfActive(token, 'a', loader)).resolves.toBe(2);
			await expect(service.memoizeIfActive(token, 'b', loader)).resolves.toBe(2);
		});
	});
});
