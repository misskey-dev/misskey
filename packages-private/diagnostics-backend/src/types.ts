/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { HeapSnapshotData } from 'diagnostics-shared/heap-snapshot';

/** 計測フェーズ。将来的に増やせるようリスト化してある */
export const memoryPhases = ['afterGc'] as const;

export type MemoryPhase = typeof memoryPhases[number];

export type MemoryStability = {
	converged: boolean;
	readingCount: number;
	elapsedMs: number;
	maxAbsoluteSlopesKiBPerSecond: Record<string, number> | null;
};

/** バックエンドを1回起動して得られる計測結果 */
export type MemorySample = {
	timestamp: string;
	phases: Record<MemoryPhase, {
		/** /proc 由来の値はKiB、ランタイム由来の値もKiBに揃えてある */
		memoryUsage: Record<string, number>;
		memoryStability: MemoryStability;
		heapSnapshot: HeapSnapshotData | null;
	}>;
};

/** base / head それぞれについて出力されるJSONレポート */
export type MemoryReport = {
	timestamp: string;
	sampleCount: number;
	aggregation: string;
	comparison?: {
		strategy: string;
		rounds: number;
		warmupRounds: number;
		startedAt: string;
	};
	summary: Record<MemoryPhase, {
		memoryUsage: Record<string, number>;
		heapSnapshot?: HeapSnapshotData;
	}>;
	samples: (MemorySample & {
		round: number;
	})[];
};
