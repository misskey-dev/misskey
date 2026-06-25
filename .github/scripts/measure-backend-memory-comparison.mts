/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createRequire } from 'node:module';
import { writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import * as util from './utility.mts';
import type { MemoryReportRaw } from '../../packages/backend/scripts/measure-memory.mts';

const phases = ['afterGc'] as const;

export type MemoryReport = {
	timestamp: string;
	sampleCount: any;
	aggregation: string;
	measurement: {
		startupTimeoutMs: any;
		memorySettleTimeMs: any;
		ipcTimeoutMs: any;
		requestCount: any;
		heapSnapshot: {
			enabled: any;
			timeoutMs: any;
			breakdownTopN: any;
		};
	};
	summary: Record<typeof phases[number], {
		memoryUsage: Record<string, number>;
		heapSnapshot?: {
			categories: Record<typeof util.heapSnapshotCategories[number], number>;
			nodeCounts: Record<typeof util.heapSnapshotCategories[number], number>;
			breakdowns?: Record<typeof util.heapSnapshotCategories[number], Record<string, number>>;
		};
	}>;
	samples: (MemoryReportRaw['samples'][number] & {
		round: number;
	})[];
};

const [baseDirArg, headDirArg, baseOutputArg, headOutputArg] = process.argv.slice(2);

const HEAP_SNAPSHOT_BREAKDOWN_TOP_N = util.readIntegerEnv('MK_MEMORY_HEAP_SNAPSHOT_BREAKDOWN_TOP_N', 6, 1);

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

function summarizeHeapSnapshotBreakdowns(samples: MemoryReport['samples'], phase: typeof phases[number]) {
	const breakdowns = {} as Record<typeof util.heapSnapshotCategories[number], Record<string, number>>;

	for (const category of util.heapSnapshotCategories) {
		if (category === 'Total') continue;

		const childKeys = new Set<string>();
		for (const sample of samples) {
			for (const childKey of Object.keys(sample.phases[phase].heapSnapshot?.breakdowns?.[category] ?? {})) {
				childKeys.add(childKey);
			}
		}

		const categoryBreakdown = {} as Record<string, number>;
		for (const childKey of childKeys) {
			const values = samples
				.map(sample => sample.phases[phase].heapSnapshot?.breakdowns?.[category]?.[childKey])
				.filter(value => Number.isFinite(value));

			if (values.length > 0) categoryBreakdown[childKey] = util.median(values);
		}

		if (Object.keys(categoryBreakdown).length > 0) {
			breakdowns[category] = collapseHeapSnapshotBreakdown(categoryBreakdown);
		}
	}

	return breakdowns;
}

function collapseHeapSnapshotBreakdown(breakdown: Record<string, number>) {
	const entries = Object.entries(breakdown)
		.filter(([, value]) => value > 0)
		.toSorted((a, b) => b[1] - a[1]);

	const topEntries = entries.slice(0, HEAP_SNAPSHOT_BREAKDOWN_TOP_N);
	const otherValue = entries
		.slice(HEAP_SNAPSHOT_BREAKDOWN_TOP_N)
		.reduce((sum, [, value]) => sum + value, 0);

	const collapsed = Object.fromEntries(topEntries);
	if (otherValue > 0) collapsed.Other = otherValue;
	return collapsed;
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

		const heapSnapshotCategoryValues = {} as Record<typeof util.heapSnapshotCategories[number], number>;
		for (const category of util.heapSnapshotCategories) {
			const values = samples
				.map(sample => sample.phases[phase].heapSnapshot?.categories?.[category])
				.filter(value => Number.isFinite(value)) as number[];

			if (values.length > 0) heapSnapshotCategoryValues[category] = util.median(values);
		}

		const heapSnapshotNodeCountValues = {} as Record<typeof util.heapSnapshotCategories[number], number>;
		for (const category of util.heapSnapshotCategories) {
			const values = samples
				.map(sample => sample.phases[phase].heapSnapshot?.nodeCounts?.[category])
				.filter(value => Number.isFinite(value)) as number[];

			if (values.length > 0) heapSnapshotNodeCountValues[category] = util.median(values);
		}

		if (Object.keys(heapSnapshotCategoryValues).length > 0) {
			const heapSnapshotBreakdowns = summarizeHeapSnapshotBreakdowns(samples, phase);

			summary[phase].heapSnapshot = {
				categories: heapSnapshotCategoryValues,
				nodeCounts: heapSnapshotNodeCountValues,
				...(Object.keys(heapSnapshotBreakdowns).length > 0 ? { breakdowns: heapSnapshotBreakdowns } : {}),
			};
		}
	}

	return summary;
}

async function measureRepo(label: string, repoDir: string, round: number) {
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
		MK_MEMORY_SAMPLE_COUNT: '1',
	} as NodeJS.ProcessEnv;
	if (round <= 0) measureEnv.MK_MEMORY_HEAP_SNAPSHOT = '0';

	const stdout = await util.run('node', ['packages/backend/scripts/measure-memory.mts'], {
		cwd: repoDir,
		env: measureEnv,
	});

	const report = JSON.parse(stdout) as MemoryReportRaw;
	const sample = report.samples[0];

	return sample;
}

async function main() {
	const baseDir = resolve(baseDirArg);
	const headDir = resolve(headDirArg);
	const baseOutput = resolve(baseOutputArg);
	const headOutput = resolve(headOutputArg);
	const rounds = util.readIntegerEnv('MK_MEMORY_COMPARE_ROUNDS', 5, 1);
	const warmupRounds = util.readIntegerEnv('MK_MEMORY_COMPARE_WARMUP_ROUNDS', 1, 0);
	const startedAt = new Date().toISOString();

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
		for (const label of ['base', 'head'] as const) {
			await measureRepo(label, reports[label].dir, -round);
		}
	}

	for (let round = 1; round <= rounds; round++) {
		const order = round % 2 === 1 ? ['base', 'head'] as const : ['head', 'base'] as const;
		process.stderr.write(`Starting measurement round ${round}/${rounds}: ${order.join(' -> ')}\n`);

		for (const [orderIndex, label] of order.entries()) {
			const sample = await measureRepo(label, reports[label].dir, round);
			reports[label].samples.push({
				...sample,
				round,
			});
		}
	}

	for (const label of ['base', 'head'] as const) {
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
			summary: summarizeSamples(reports[label].samples),
			samples: reports[label].samples,
		};

		await writeFile(label === 'base' ? baseOutput : headOutput, `${JSON.stringify(report, null, 2)}\n`);
	}
}

main().catch(err => {
	console.error(err);
	process.exit(1);
});
