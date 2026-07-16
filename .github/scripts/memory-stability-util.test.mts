/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import assert from 'node:assert/strict';
import test from 'node:test';
import { measureMemoryUntilStable } from './memory-stability-util.mts';

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

	assert.equal(readCount, 3);
	assert.deepEqual(result.memoryUsage, readings[2]);
	assert.deepEqual(result.stability, {
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

	assert.equal(readCount, 5);
	assert.equal(result.stability.converged, true);
	assert.deepEqual(result.stability.maxAbsoluteSlopesKiBPerSecond, {
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

	assert.equal(readCount, 6);
	assert.deepEqual(result.memoryUsage, readings[5]);
	assert.deepEqual(result.stability, {
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

	assert.equal(readCount, 6);
	assert.equal(result.stability.converged, false);
	assert.deepEqual(result.stability.maxAbsoluteSlopesKiBPerSecond, {
		Pss: 300,
		Private_Dirty: 0,
	});
});
