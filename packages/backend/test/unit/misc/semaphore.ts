/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test } from 'vitest';
import { Semaphore } from '@/misc/semaphore.js';

function deferred() {
	let resolve!: () => void;
	let reject!: (err: Error) => void;
	const promise = new Promise<void>((res, rej) => {
		resolve = res;
		reject = rej;
	});
	return { promise, resolve, reject };
}

/** 保留中のマイクロタスクを流し切る */
function flush() {
	return new Promise<void>(resolve => setImmediate(resolve));
}

describe('misc:Semaphore', () => {
	test('rejects a non-positive or non-integer limit', () => {
		expect(() => new Semaphore(0)).toThrow(RangeError);
		expect(() => new Semaphore(1.5)).toThrow(RangeError);
	});

	test('runs at most `limit` tasks at the same time, in arrival order', async () => {
		const semaphore = new Semaphore(2);
		const gates = [deferred(), deferred(), deferred()];
		const started: number[] = [];

		const tasks = gates.map((gate, i) => semaphore.run(async () => {
			started.push(i);
			await gate.promise;
			return i;
		}));

		await flush();
		expect(started).toEqual([0, 1]);

		gates[1].resolve();
		await flush();
		expect(started).toEqual([0, 1, 2]);

		gates[0].resolve();
		gates[2].resolve();
		await expect(Promise.all(tasks)).resolves.toEqual([0, 1, 2]);
	});

	test('releases the slot when a task fails', async () => {
		const semaphore = new Semaphore(1);
		const failing = semaphore.run(async () => {
			throw new Error('boom');
		});
		await expect(failing).rejects.toThrow('boom');

		await expect(semaphore.run(async () => 'next')).resolves.toBe('next');
	});
});
