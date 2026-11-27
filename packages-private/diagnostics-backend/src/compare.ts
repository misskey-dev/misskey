/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { copyFile, rm, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { execa } from 'execa';
import { readBooleanEnv, readIntegerEnv, readOptionalEnv } from 'diagnostics-shared/env';
import { median } from 'diagnostics-shared/stats';
import { summarizeHeapSnapshotDataSamples, defaultHeapSnapshotBreakdownTopN } from 'diagnostics-shared/heap-snapshot';
import { resetState } from './db';
import {
	clampHeapSnapshotRounds,
	selectRepresentativeHeapSnapshotRound,
	shouldCollectHeapSnapshot,
} from './heap-snapshot-sampling';
import { measureBackendMemory } from './measure';
import { memoryPhases, type MemoryReport } from './types';

const heapSnapshotLabels = ['base', 'head'] as const;

type HeapSnapshotLabel = typeof heapSnapshotLabels[number];

export type CompareOptions = {
	baseDir: string;
	headDir: string;
	baseOutput: string;
	headOutput: string;
};

const HEAP_SNAPSHOT_BREAKDOWN_TOP_N = readIntegerEnv('MK_MEMORY_HEAP_SNAPSHOT_BREAKDOWN_TOP_N', defaultHeapSnapshotBreakdownTopN, 1);
// 成果物 (artifact) としてアップロードされるファイルの出力先。CIではworkspace直下を指す
const HEAP_SNAPSHOT_OUTPUT_DIR = resolve(readOptionalEnv('MK_MEMORY_HEAP_SNAPSHOT_OUTPUT_DIR') ?? process.cwd());
const HEAP_SNAPSHOT_WORK_DIRS = {
	base: join(HEAP_SNAPSHOT_OUTPUT_DIR, 'base-heap-snapshots'),
	head: join(HEAP_SNAPSHOT_OUTPUT_DIR, 'head-heap-snapshots'),
};
const HEAP_SNAPSHOT_OUTPUT_PATHS = {
	base: join(HEAP_SNAPSHOT_OUTPUT_DIR, 'base-heap-snapshot.heapsnapshot'),
	head: join(HEAP_SNAPSHOT_OUTPUT_DIR, 'head-heap-snapshot.heapsnapshot'),
};

export function summarizeSamples(samples: MemoryReport['samples']) {
	const summary = {} as MemoryReport['summary'];

	for (const phase of memoryPhases) {
		summary[phase] = {
			memoryUsage: {},
		};

		const metricKeys = new Set<string>();
		for (const sample of samples) {
			for (const key of Object.keys(sample.phases[phase].memoryUsage)) {
				metricKeys.add(key);
			}
		}

		for (const key of metricKeys) {
			const values = samples.map(sample => sample.phases[phase].memoryUsage[key]);
			summary[phase].memoryUsage[key] = median(values);
		}

		const heapSnapshot = summarizeHeapSnapshotDataSamples(
			samples,
			sample => sample.phases[phase].heapSnapshot,
			{ breakdownTopN: HEAP_SNAPSHOT_BREAKDOWN_TOP_N },
		);
		if (heapSnapshot != null) summary[phase].heapSnapshot = heapSnapshot;
	}

	return summary;
}

type GenSampleOptions = {
	collectHeapSnapshot?: boolean;
	heapSnapshotSavePath?: string;
};

async function genSample(label: string, repoDir: string, round: number, options: GenSampleOptions = {}) {
	process.stderr.write(`[${label}] Resetting database and Redis\n`);
	await resetState();

	process.stderr.write(`[${label}] Running migrations\n`);
	// 出力はログとして流しつつ手元にも残す (失敗時にexecaが例外メッセージへ含めてくれる)
	await execa('pnpm', ['--filter', 'backend', 'migrate'], {
		cwd: repoDir,
		stdout: ['pipe', process.stderr],
		stderr: ['pipe', process.stderr],
	});

	process.stderr.write(`[${label}] Measuring memory\n`);
	return await measureBackendMemory(resolve(repoDir, 'packages/backend'), {
		// warmupラウンド (round <= 0) は捨てるので、重いheap snapshotは取らない
		...(round <= 0 || options.collectHeapSnapshot === false ? { heapSnapshot: false } : {}),
		heapSnapshotSavePath: options.heapSnapshotSavePath ?? null,
	});
}

function heapSnapshotPath(label: HeapSnapshotLabel, round: number) {
	return join(HEAP_SNAPSHOT_WORK_DIRS[label], `round-${round}.heapsnapshot`);
}

async function saveRepresentativeHeapSnapshot(label: HeapSnapshotLabel, samples: MemoryReport['samples'], summary: MemoryReport['summary']) {
	const round = selectRepresentativeHeapSnapshotRound(
		samples,
		summary.afterGc.heapSnapshot?.categories.total,
		sample => sample.phases.afterGc.heapSnapshot?.categories.total,
	);
	if (round == null) return;

	await copyFile(heapSnapshotPath(label, round), HEAP_SNAPSHOT_OUTPUT_PATHS[label]);
	process.stderr.write(`Selected ${label} heap snapshot round ${round} for artifact\n`);
	await rm(HEAP_SNAPSHOT_WORK_DIRS[label], { recursive: true, force: true });
}

/**
 * base / head を交互に計測してJSONレポートを書き出す。
 * 交互にするのは、実行順やマシンの状態による偏りを両者に均等に載せるため。
 */
export async function compareBackendMemory(options: CompareOptions) {
	const rounds = readIntegerEnv('MK_MEMORY_COMPARE_ROUNDS', 5, 1);
	const warmupRounds = readIntegerEnv('MK_MEMORY_COMPARE_WARMUP_ROUNDS', 1, 0);
	const heapSnapshotsEnabled = readBooleanEnv('MK_MEMORY_HEAP_SNAPSHOT', false);
	const requestedHeapSnapshotRounds = heapSnapshotsEnabled
		? readIntegerEnv('MK_MEMORY_HEAP_SNAPSHOT_ROUNDS', rounds, 1)
		: 0;
	const heapSnapshotRounds = clampHeapSnapshotRounds(rounds, requestedHeapSnapshotRounds);
	const startedAt = new Date().toISOString();

	for (const label of heapSnapshotLabels) {
		await rm(HEAP_SNAPSHOT_WORK_DIRS[label], { recursive: true, force: true });
		await rm(HEAP_SNAPSHOT_OUTPUT_PATHS[label], { force: true });
	}

	const reports = {
		base: {
			dir: options.baseDir,
			samples: [] as MemoryReport['samples'],
		},
		head: {
			dir: options.headDir,
			samples: [] as MemoryReport['samples'],
		},
	};

	for (let round = 1; round <= warmupRounds; round++) {
		process.stderr.write(`Starting warmup round ${round}/${warmupRounds}\n`);
		for (const label of heapSnapshotLabels) {
			await genSample(label, reports[label].dir, -round);
		}
	}

	for (let round = 1; round <= rounds; round++) {
		const order = round % 2 === 1 ? ['base', 'head'] as const : ['head', 'base'] as const;
		process.stderr.write(`Starting measurement round ${round}/${rounds}: ${order.join(' -> ')}\n`);

		for (const label of order) {
			const collectHeapSnapshot = shouldCollectHeapSnapshot(round, rounds, heapSnapshotRounds);
			const sample = await genSample(label, reports[label].dir, round, {
				collectHeapSnapshot,
				...(collectHeapSnapshot ? { heapSnapshotSavePath: heapSnapshotPath(label, round) } : {}),
			});
			reports[label].samples.push({
				...sample,
				round,
			});
		}
	}

	const summaries = {
		base: summarizeSamples(reports.base.samples),
		head: summarizeSamples(reports.head.samples),
	};
	for (const label of heapSnapshotLabels) {
		await saveRepresentativeHeapSnapshot(label, reports[label].samples, summaries[label]);
	}

	for (const label of heapSnapshotLabels) {
		const report: MemoryReport = {
			timestamp: new Date().toISOString(),
			sampleCount: reports[label].samples.length,
			aggregation: 'median',
			comparison: {
				strategy: 'interleaved-pairs',
				rounds,
				warmupRounds,
				heapSnapshotRounds,
				startedAt,
			},
			summary: summaries[label],
			samples: reports[label].samples,
		};

		await writeFile(label === 'base' ? options.baseOutput : options.headOutput, `${JSON.stringify(report, null, 2)}\n`);
	}
}
