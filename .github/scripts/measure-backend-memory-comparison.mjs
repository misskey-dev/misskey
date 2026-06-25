/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const phases = ['beforeGc', 'afterGc', 'afterRequest'];
const heapSnapshotCategories = [
	'Code',
	'Strings',
	'JS arrays',
	'Typed arrays',
	'System objects',
	'Other JS objects',
	'Other non-JS objects',
	'Total',
];

const [baseDirArg, headDirArg, baseOutputArg, headOutputArg] = process.argv.slice(2);

if (baseDirArg == null || headDirArg == null || baseOutputArg == null || headOutputArg == null) {
	console.error('Usage: node .github/scripts/measure-backend-memory-comparison.mjs <base-dir> <head-dir> <base-output.json> <head-output.json>');
	process.exit(1);
}

function readIntegerEnv(name, defaultValue, min) {
	const rawValue = process.env[name];
	if (rawValue == null || rawValue === '') return defaultValue;
	if (!/^\d+$/.test(rawValue)) throw new Error(`${name} must be an integer`);

	const value = Number(rawValue);
	if (!Number.isSafeInteger(value) || value < min) throw new Error(`${name} must be >= ${min}`);
	return value;
}

const HEAP_SNAPSHOT_BREAKDOWN_TOP_N = readIntegerEnv('MK_MEMORY_HEAP_SNAPSHOT_BREAKDOWN_TOP_N', 6, 1);

function commandName(command) {
	if (process.platform !== 'win32') return command;
	if (command === 'pnpm') return 'pnpm.cmd';
	return command;
}

function run(command, args, options = {}) {
	return new Promise((resolvePromise, reject) => {
		const child = spawn(commandName(command), args, {
			cwd: options.cwd,
			env: options.env,
			stdio: ['ignore', 'pipe', 'pipe'],
		});

		let stdout = '';
		let stderr = '';

		child.stdout.on('data', data => {
			stdout += data;
			if (options.logStdout) process.stderr.write(data);
		});

		child.stderr.on('data', data => {
			stderr += data;
			process.stderr.write(data);
		});

		child.on('error', reject);

		child.on('close', code => {
			if (code === 0) {
				resolvePromise(stdout);
			} else {
				reject(new Error(`${command} ${args.join(' ')} failed with exit code ${code}\n${stderr}`));
			}
		});
	});
}

async function resetState(repoDir) {
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

function median(values) {
	const sorted = values.toSorted((a, b) => a - b);
	const center = Math.floor(sorted.length / 2);
	if (sorted.length % 2 === 1) return sorted[center];
	return Math.round((sorted[center - 1] + sorted[center]) / 2);
}

function summarizeHeapSnapshotBreakdowns(samples, phase) {
	const breakdowns = {};

	for (const category of heapSnapshotCategories) {
		if (category === 'Total') continue;

		const childKeys = new Set();
		for (const sample of samples) {
			for (const childKey of Object.keys(sample[phase]?.heapSnapshot?.breakdowns?.[category] ?? {})) {
				childKeys.add(childKey);
			}
		}

		const categoryBreakdown = {};
		for (const childKey of childKeys) {
			const values = samples
				.map(sample => sample[phase]?.heapSnapshot?.breakdowns?.[category]?.[childKey])
				.filter(value => Number.isFinite(value));

			if (values.length > 0) categoryBreakdown[childKey] = median(values);
		}

		if (Object.keys(categoryBreakdown).length > 0) {
			breakdowns[category] = collapseHeapSnapshotBreakdown(categoryBreakdown);
		}
	}

	return breakdowns;
}

function collapseHeapSnapshotBreakdown(breakdown) {
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

function summarizeSamples(samples) {
	const summary = {};

	for (const phase of phases) {
		summary[phase] = {};

		const metricKeys = new Set();
		for (const sample of samples) {
			for (const key of Object.keys(sample[phase] ?? {})) {
				metricKeys.add(key);
			}
		}

		for (const key of metricKeys) {
			const values = samples
				.map(sample => sample[phase]?.[key])
				.filter(value => Number.isFinite(value));

			if (values.length > 0) summary[phase][key] = median(values);
		}

		const heapSnapshotCategoryValues = {};
		for (const category of heapSnapshotCategories) {
			const values = samples
				.map(sample => sample[phase]?.heapSnapshot?.categories?.[category])
				.filter(value => Number.isFinite(value));

			if (values.length > 0) heapSnapshotCategoryValues[category] = median(values);
		}

		const heapSnapshotNodeCountValues = {};
		for (const category of heapSnapshotCategories) {
			const values = samples
				.map(sample => sample[phase]?.heapSnapshot?.nodeCounts?.[category])
				.filter(value => Number.isFinite(value));

			if (values.length > 0) heapSnapshotNodeCountValues[category] = median(values);
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

async function measureRepo(label, repoDir, round, orderIndex) {
	process.stderr.write(`[${label}] Resetting database and Redis\n`);
	await resetState(repoDir);

	process.stderr.write(`[${label}] Running migrations\n`);
	await run('pnpm', ['--filter', 'backend', 'migrate'], {
		cwd: repoDir,
		env: process.env,
		logStdout: true,
	});

	process.stderr.write(`[${label}] Measuring memory\n`);
	const measureEnv = {
		...process.env,
		MK_MEMORY_SAMPLE_COUNT: '1',
	};
	if (round <= 0) measureEnv.MK_MEMORY_HEAP_SNAPSHOT = '0';

	const stdout = await run('node', ['packages/backend/scripts/measure-memory.mjs'], {
		cwd: repoDir,
		env: measureEnv,
	});

	const report = JSON.parse(stdout);
	const sample = report.samples?.[0] ?? {
		timestamp: report.timestamp,
		beforeGc: report.beforeGc,
		afterGc: report.afterGc,
		afterRequest: report.afterRequest,
	};

	return {
		...sample,
		label,
		round,
		orderIndex,
	};
}

async function main() {
	const baseDir = resolve(baseDirArg);
	const headDir = resolve(headDirArg);
	const baseOutput = resolve(baseOutputArg);
	const headOutput = resolve(headOutputArg);
	const rounds = readIntegerEnv('MK_MEMORY_COMPARE_ROUNDS', 5, 1);
	const warmupRounds = readIntegerEnv('MK_MEMORY_COMPARE_WARMUP_ROUNDS', 1, 0);
	const startedAt = new Date().toISOString();

	const repos = {
		base: {
			dir: baseDir,
			samples: [],
		},
		head: {
			dir: headDir,
			samples: [],
		},
	};

	for (let round = 1; round <= warmupRounds; round++) {
		process.stderr.write(`Starting warmup round ${round}/${warmupRounds}\n`);
		for (const label of ['base', 'head']) {
			await measureRepo(label, repos[label].dir, -round, 0);
		}
	}

	for (let round = 1; round <= rounds; round++) {
		const order = round % 2 === 1 ? ['base', 'head'] : ['head', 'base'];
		process.stderr.write(`Starting measurement round ${round}/${rounds}: ${order.join(' -> ')}\n`);

		for (const [orderIndex, label] of order.entries()) {
			const sample = await measureRepo(label, repos[label].dir, round, orderIndex);
			repos[label].samples.push(sample);
		}
	}

	for (const label of ['base', 'head']) {
		const report = {
			timestamp: new Date().toISOString(),
			sampleCount: repos[label].samples.length,
			aggregation: 'median',
			comparison: {
				strategy: 'interleaved-pairs',
				rounds,
				warmupRounds,
				startedAt,
			},
			...summarizeSamples(repos[label].samples),
			samples: repos[label].samples,
		};

		await writeFile(label === 'base' ? baseOutput : headOutput, `${JSON.stringify(report, null, 2)}\n`);
	}
}

main().catch(err => {
	console.error(err);
	process.exit(1);
});
