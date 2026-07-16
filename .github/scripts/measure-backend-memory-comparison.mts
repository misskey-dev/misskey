/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createRequire } from 'node:module';
import { copyFile, rm, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import * as util from './utility.mts';
import * as heapSnapshotUtil from './heap-snapshot-util.mts';
import type { MemorySample } from '../../packages/backend/scripts/measure-memory.mts';

const phases = ['afterGc'] as const;

export type MemoryReport = {
	timestamp: string;
	sampleCount: number;
	aggregation: string;
	summary: Record<typeof phases[number], {
		memoryUsage: Record<string, number>;
		heapSnapshot?: heapSnapshotUtil.HeapSnapshotData;
	}>;
	samples: (MemorySample & {
		round: number;
	})[];
};

const [baseDirArg, headDirArg, baseOutputArg, headOutputArg] = process.argv.slice(2);

const HEAP_SNAPSHOT_BREAKDOWN_TOP_N = util.readIntegerEnv('MK_MEMORY_HEAP_SNAPSHOT_BREAKDOWN_TOP_N', heapSnapshotUtil.defaultHeapSnapshotBreakdownTopN, 1);
const heapSnapshotLabels = ['base', 'head'] as const;
const HEAP_SNAPSHOT_WORK_DIRS = {
	base: resolve('base-heap-snapshots'),
	head: resolve('head-heap-snapshots'),
};
const HEAP_SNAPSHOT_OUTPUT_PATHS = {
	base: resolve('base-heap-snapshot.heapsnapshot'),
	head: resolve('head-heap-snapshot.heapsnapshot'),
};
// Use the head checkout's measurement harness for both targets so only the built backend differs.
const MEASURE_MEMORY_SCRIPT = resolve(import.meta.dirname, '../../packages/backend/scripts/measure-memory.mts');

async function resetState(repoDir: string) {
	const require = createRequire(join(repoDir, 'packages/backend/package.json'));
	const pg = require('pg');
	const Redis = require('ioredis');

	const postgres = new pg.Client({
		host: '127.0.0.1',
		port: 54312,
		database: 'postgres',
		user: 'postgres',
	});

	await postgres.connect();
	try {
		await postgres.query('DROP DATABASE IF EXISTS "test-misskey" WITH (FORCE)');
		await postgres.query('CREATE DATABASE "test-misskey"');
	} finally {
		await postgres.end();
	}

	const redis = new Redis({ host: '127.0.0.1', port: 56312 });
	try {
		await redis.flushall();
	} finally {
		redis.disconnect();
	}
}

function summarizeSamples(samples: MemoryReport['samples']) {
	const summary = {} as MemoryReport['summary'];

	for (const phase of phases) {
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
			summary[phase].memoryUsage[key] = util.median(values);
		}

		const heapSnapshot = heapSnapshotUtil.summarizeHeapSnapshotDataSamples(
			samples,
			sample => sample.phases[phase].heapSnapshot,
			{ breakdownTopN: HEAP_SNAPSHOT_BREAKDOWN_TOP_N },
		);
		if (heapSnapshot != null) summary[phase].heapSnapshot = heapSnapshot;
	}

	return summary;
}

async function measureRepo(label: string, repoDir: string, round: number, options: { heapSnapshotSavePath?: string } = {}) {
	process.stderr.write(`[${label}] Resetting database and Redis\n`);
	await resetState(repoDir);

	process.stderr.write(`[${label}] Running migrations\n`);
	await util.run('pnpm', ['--filter', 'backend', 'migrate'], {
		cwd: repoDir,
		env: process.env,
		logStdout: true,
	});

	process.stderr.write(`[${label}] Measuring memory\n`);
	const measureEnv = {
		...process.env,
		MK_MEMORY_BACKEND_DIR: resolve(repoDir, 'packages/backend'),
	} as NodeJS.ProcessEnv;
	if (round <= 0) measureEnv.MK_MEMORY_HEAP_SNAPSHOT = '0';
	if (options.heapSnapshotSavePath != null) measureEnv.MK_MEMORY_HEAP_SNAPSHOT_SAVE_PATH = options.heapSnapshotSavePath;

	const stdout = await util.run('node', [MEASURE_MEMORY_SCRIPT], {
		cwd: repoDir,
		env: measureEnv,
	});

	return JSON.parse(stdout) as MemorySample;
}

function heapSnapshotPath(label: typeof heapSnapshotLabels[number], round: number) {
	return join(HEAP_SNAPSHOT_WORK_DIRS[label], `round-${round}.heapsnapshot`);
}

function selectRepresentativeHeapSnapshotRound(samples: MemoryReport['samples'], summary: MemoryReport['summary']) {
	const medianTotal = summary.afterGc.heapSnapshot?.categories?.total;
	if (medianTotal == null || !Number.isFinite(medianTotal)) return null;

	let selected: { round: number; distance: number } | null = null;
	for (const sample of samples) {
		const total = sample.phases.afterGc.heapSnapshot?.categories?.total;
		if (total == null || !Number.isFinite(total)) continue;

		const distance = Math.abs(total - medianTotal);
		if (selected == null || distance < selected.distance || (distance === selected.distance && sample.round < selected.round)) {
			selected = {
				round: sample.round,
				distance,
			};
		}
	}

	return selected?.round ?? null;
}

async function saveRepresentativeHeapSnapshot(label: typeof heapSnapshotLabels[number], samples: MemoryReport['samples'], summary: MemoryReport['summary']) {
	const round = selectRepresentativeHeapSnapshotRound(samples, summary);
	if (round == null) return;

	await copyFile(heapSnapshotPath(label, round), HEAP_SNAPSHOT_OUTPUT_PATHS[label]);
	process.stderr.write(`Selected ${label} heap snapshot round ${round} for artifact\n`);
	await rm(HEAP_SNAPSHOT_WORK_DIRS[label], { recursive: true, force: true });
}

async function main() {
	const baseDir = resolve(baseDirArg);
	const headDir = resolve(headDirArg);
	const baseOutput = resolve(baseOutputArg);
	const headOutput = resolve(headOutputArg);
	const rounds = util.readIntegerEnv('MK_MEMORY_COMPARE_ROUNDS', 5, 1);
	const warmupRounds = util.readIntegerEnv('MK_MEMORY_COMPARE_WARMUP_ROUNDS', 1, 0);
	const startedAt = new Date().toISOString();

	for (const label of heapSnapshotLabels) {
		await rm(HEAP_SNAPSHOT_WORK_DIRS[label], { recursive: true, force: true });
		await rm(HEAP_SNAPSHOT_OUTPUT_PATHS[label], { force: true });
	}

	const reports = {
		base: {
			dir: baseDir,
			samples: [] as MemoryReport['samples'],
		},
		head: {
			dir: headDir,
			samples: [] as MemoryReport['samples'],
		},
	};

	for (let round = 1; round <= warmupRounds; round++) {
		process.stderr.write(`Starting warmup round ${round}/${warmupRounds}\n`);
		for (const label of heapSnapshotLabels) {
			await measureRepo(label, reports[label].dir, -round);
		}
	}

	for (let round = 1; round <= rounds; round++) {
		const order = round % 2 === 1 ? ['base', 'head'] as const : ['head', 'base'] as const;
		process.stderr.write(`Starting measurement round ${round}/${rounds}: ${order.join(' -> ')}\n`);

		for (const label of order) {
			const options = { heapSnapshotSavePath: heapSnapshotPath(label, round) };
			const sample = await measureRepo(label, reports[label].dir, round, options);
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
		const report = {
			timestamp: new Date().toISOString(),
			sampleCount: reports[label].samples.length,
			aggregation: 'median',
			comparison: {
				strategy: 'interleaved-pairs',
				rounds,
				warmupRounds,
				startedAt,
			},
			summary: summaries[label],
			samples: reports[label].samples,
		};

		await writeFile(label === 'base' ? baseOutput : headOutput, `${JSON.stringify(report, null, 2)}\n`);
	}
}

main().catch(err => {
	console.error(err);
	process.exit(1);
});
