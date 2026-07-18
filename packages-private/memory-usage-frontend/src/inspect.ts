/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { copyFile, mkdir, rm, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { readIntegerEnv, readOptionalEnv } from 'diagnostics-shared/env';
import { analyzeHeapSnapshot, defaultHeapSnapshotBreakdownTopN } from 'diagnostics-shared/heap-snapshot';
import { HeadlessChromeController } from './browser/controller';
import { summarizeNetwork } from './browser/network';
import { prepareInstance, runSignupAndPostScenario, scenarioDescription } from './scenario';
import { startServer, stopServer, waitForServer } from './server';
import { selectRepresentativeSample, summarizeSamples } from './summarize';
import type { BrowserMeasurementSample, BrowserMetricsReport } from './types';

type Label = 'base' | 'head';

const labels = ['base', 'head'] as const satisfies readonly Label[];

const baseUrl = process.env.FRONTEND_BROWSER_METRICS_URL ?? 'http://127.0.0.1:61812';
const sampleCount = readIntegerEnv('FRONTEND_BROWSER_METRICS_SAMPLE_COUNT', 5, 1);
const heapSnapshotBreakdownTopN = readIntegerEnv('FRONTEND_BROWSER_HEAP_SNAPSHOT_BREAKDOWN_TOP_N', defaultHeapSnapshotBreakdownTopN, 1);

// 成果物 (artifact) としてアップロードされるファイルの出力先。CIではworkspace直下を指す
const heapSnapshotOutputDir = resolve(readOptionalEnv('FRONTEND_BROWSER_HEAP_SNAPSHOT_OUTPUT_DIR') ?? process.cwd());
const heapSnapshotWorkDirs = {
	base: join(heapSnapshotOutputDir, 'frontend-browser-base-heap-snapshots'),
	head: join(heapSnapshotOutputDir, 'frontend-browser-head-heap-snapshots'),
} as const;
const heapSnapshotOutputPaths = {
	base: join(heapSnapshotOutputDir, 'base-heap-snapshot.heapsnapshot'),
	head: join(heapSnapshotOutputDir, 'head-heap-snapshot.heapsnapshot'),
} as const;

function heapSnapshotPath(label: Label, round: number) {
	return join(heapSnapshotWorkDirs[label], `round-${round}.heapsnapshot`);
}

/**
 * ブラウザを毎ラウンド立ち上げ直して1サンプル分を計測する。
 * ブラウザを使い回すとキャッシュや前ラウンドのGC残渣が乗るため、必ず作り直す。
 */
async function measureSample(label: Label, round: number, heapSnapshotSavePath: string): Promise<BrowserMeasurementSample> {
	await prepareInstance(baseUrl);

	return await HeadlessChromeController.with(label, { scenarioTimeoutMs: 120000, baseUrl }, async chrome => {
		await chrome.enableNetworkTracking();

		const startedAt = Date.now();
		await runSignupAndPostScenario(chrome, baseUrl);
		const durationMs = Date.now() - startedAt;

		await chrome.waitForNetworkDetails();
		const performance = await chrome.collectPerformance();
		const heapSnapshotRaw = await chrome.takeHeapSnapshot(heapSnapshotSavePath);

		return {
			label,
			round,
			timestamp: new Date().toISOString(),
			url: baseUrl,
			scenario: scenarioDescription,
			diagnostics: chrome.collectDiagnostics(),
			durationMs,
			network: summarizeNetwork(chrome.networkRequests, baseUrl, chrome.webSocketConnections),
			networkRequests: chrome.networkRequests,
			performance,
			heapSnapshot: analyzeHeapSnapshot(heapSnapshotRaw, { breakdownTopN: heapSnapshotBreakdownTopN }),
		};
	});
}

/**
 * 中央値に最も近いラウンドのスナップショットだけを成果物として残し、残りは捨てる。
 */
async function saveRepresentativeHeapSnapshot(label: Label, report: BrowserMetricsReport) {
	const representative = selectRepresentativeSample(report.samples, sample => sample.heapSnapshot.categories.total);
	await copyFile(heapSnapshotPath(label, representative.round), heapSnapshotOutputPaths[label]);
	process.stderr.write(`[${label}] Selected round ${representative.round} heap snapshot for artifact\n`);
	await rm(heapSnapshotWorkDirs[label], { recursive: true, force: true });
}

async function genReport(label: Label, repoDir: string, outputPath: string) {
	let server: ReturnType<typeof startServer> | null = null;

	try {
		server = startServer(label, repoDir);
		await waitForServer(baseUrl, server);

		await rm(heapSnapshotWorkDirs[label], { recursive: true, force: true });
		await mkdir(heapSnapshotWorkDirs[label], { recursive: true });

		const samples: BrowserMeasurementSample[] = [];
		for (let round = 1; round <= sampleCount; round++) {
			process.stderr.write(`[${label}] Measuring browser metrics sample ${round}/${sampleCount}\n`);
			samples.push(await measureSample(label, round, heapSnapshotPath(label, round)));
		}

		const report = summarizeSamples(label, samples, { url: baseUrl, heapSnapshotBreakdownTopN });
		await writeFile(outputPath, JSON.stringify(report, null, '\t'));
		process.stderr.write(`[${label}] Wrote browser metrics report to ${outputPath}\n`);

		await saveRepresentativeHeapSnapshot(label, report);
	} finally {
		if (server != null) await stopServer(server);
	}
}

async function main() {
	const [baseDirArg, headDirArg, baseOutputArg, headOutputArg] = process.argv.slice(2);
	if (baseDirArg == null || headDirArg == null || baseOutputArg == null || headOutputArg == null) {
		throw new Error('Usage: inspect <baseDir> <headDir> <baseOutputJson> <headOutputJson>');
	}

	for (const label of labels) {
		await rm(heapSnapshotOutputPaths[label], { force: true });
	}

	// base / head は同じポートでサーバーを立てるため、並行させず順番に計測する
	await genReport('base', resolve(baseDirArg), resolve(baseOutputArg));
	await genReport('head', resolve(headDirArg), resolve(headOutputArg));
}

await main().catch(err => {
	console.error(err);
	process.exit(1);
});
