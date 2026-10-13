/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { setTimeout } from 'node:timers/promises';

type MemoryStabilityTimer = {
	now: () => number;
	wait: (durationMs: number) => Promise<void>;
};

const intervalMs = 2000;
const maxWaitMs = 10000;
const windowSize = 3;
const slopeThresholdKiBPerSecond = 256;
const stabilityMetrics = ['Pss', 'Private_Dirty'] as const;

const defaultTimer: MemoryStabilityTimer = {
	now: () => performance.now(),
	wait: durationMs => setTimeout(durationMs),
};

function getMaxAbsoluteSlopes<T extends Record<string, number>>(readings: { elapsedMs: number; memoryUsage: T }[]) {
	const result = {} as Record<typeof stabilityMetrics[number], number>;

	for (const metric of stabilityMetrics) {
		let maxAbsoluteSlope = 0;
		for (let i = 1; i < readings.length; i++) {
			const previous = readings[i - 1];
			const current = readings[i];
			const durationSeconds = (current.elapsedMs - previous.elapsedMs) / 1000;
			maxAbsoluteSlope = Math.max(maxAbsoluteSlope, Math.abs(current.memoryUsage[metric] - previous.memoryUsage[metric]) / durationSeconds);
		}
		result[metric] = maxAbsoluteSlope;
	}

	return result;
}

/**
 * メモリ使用量が落ち着くまで繰り返し読み取る。
 * 起動直後は遅延初期化でじわじわ増え続けるため、直近 `windowSize` 件の傾きが十分小さくなるまで待つ。
 */
export async function measureMemoryUntilStable<T extends Record<string, number>>(
	readMemoryUsage: () => Promise<T>,
	timer: MemoryStabilityTimer = defaultTimer,
) {
	const startedAt = timer.now();
	const readings: { elapsedMs: number; memoryUsage: T }[] = [];
	let maxAbsoluteSlopesKiBPerSecond: Record<typeof stabilityMetrics[number], number> | null = null;

	while (true) {
		const memoryUsage = await readMemoryUsage();
		const elapsedMs = timer.now() - startedAt;
		readings.push({ elapsedMs, memoryUsage });

		let converged = false;
		if (readings.length >= windowSize) {
			const latestSlopes = getMaxAbsoluteSlopes(readings.slice(-windowSize));
			maxAbsoluteSlopesKiBPerSecond = latestSlopes;
			converged = stabilityMetrics.every(metric => latestSlopes[metric] <= slopeThresholdKiBPerSecond);
		}

		if (converged || elapsedMs >= maxWaitMs) {
			return {
				memoryUsage,
				stability: {
					converged,
					readingCount: readings.length,
					elapsedMs,
					maxAbsoluteSlopesKiBPerSecond,
				},
			};
		}

		await timer.wait(Math.min(intervalMs, maxWaitMs - elapsedMs));
	}
}
