/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { expect, test } from 'vitest';
import { measureMemoryUntilStable } from '../src/measure/stability';

function createTimer() {
	let elapsedMs = 0;

	return {
		now: () => elapsedMs,
		wait: async (durationMs: number) => {
			elapsedMs += durationMs;
		},
	};
}

async function measure(readings: Record<string, number>[]) {
	let readCount = 0;
	const result = await measureMemoryUntilStable(
		async () => readings[readCount++],
		createTimer(),
	);
	return { result, readCount };
}

test('adopts the latest reading once Pss and Private_Dirty slopes converge', async () => {
	const readings = [
		{ Pss: 1000, Private_Dirty: 500, HeapUsed: 300 },
		{ Pss: 1100, Private_Dirty: 520, HeapUsed: 310 },
		{ Pss: 1200, Private_Dirty: 540, HeapUsed: 320 },
	];
	const { result, readCount } = await measure(readings);

	expect(readCount).toBe(3);
	expect(result.memoryUsage).toStrictEqual(readings[2]);
	expect(result.stability).toStrictEqual({
		converged: true,
		readingCount: 3,
		elapsedMs: 4000,
		maxAbsoluteSlopesKiBPerSecond: {
			Pss: 50,
			Private_Dirty: 10,
		},
	});
});

test('uses only the latest readings when determining convergence', async () => {
	const readings = [
		{ Pss: 1000, Private_Dirty: 500 },
		{ Pss: 2000, Private_Dirty: 1000 },
		{ Pss: 3000, Private_Dirty: 1500 },
		{ Pss: 3040, Private_Dirty: 1520 },
		{ Pss: 3080, Private_Dirty: 1540 },
	];
	const { result, readCount } = await measure(readings);

	expect(readCount).toBe(5);
	expect(result.stability.converged).toBe(true);
	expect(result.stability.maxAbsoluteSlopesKiBPerSecond).toStrictEqual({
		Pss: 20,
		Private_Dirty: 10,
	});
});

test('bounds the wait and reports the latest slopes when memory does not converge', async () => {
	const readings = [
		{ Pss: 1000, Private_Dirty: 500 },
		{ Pss: 1600, Private_Dirty: 520 },
		{ Pss: 2200, Private_Dirty: 540 },
		{ Pss: 2800, Private_Dirty: 560 },
		{ Pss: 3400, Private_Dirty: 580 },
		{ Pss: 4000, Private_Dirty: 600 },
	];
	const { result, readCount } = await measure(readings);

	expect(readCount).toBe(6);
	expect(result.memoryUsage).toStrictEqual(readings[5]);
	expect(result.stability).toStrictEqual({
		converged: false,
		readingCount: 6,
		elapsedMs: 10000,
		maxAbsoluteSlopesKiBPerSecond: {
			Pss: 300,
			Private_Dirty: 10,
		},
	});
});

test('does not treat opposing adjacent slopes as convergence', async () => {
	const readings = [
		{ Pss: 1000, Private_Dirty: 500 },
		{ Pss: 1600, Private_Dirty: 500 },
		{ Pss: 1000, Private_Dirty: 500 },
		{ Pss: 1600, Private_Dirty: 500 },
		{ Pss: 1000, Private_Dirty: 500 },
		{ Pss: 1600, Private_Dirty: 500 },
	];
	const { result, readCount } = await measure(readings);

	expect(readCount).toBe(6);
	expect(result.stability.converged).toBe(false);
	expect(result.stability.maxAbsoluteSlopesKiBPerSecond).toStrictEqual({
		Pss: 300,
		Private_Dirty: 0,
	});
});
