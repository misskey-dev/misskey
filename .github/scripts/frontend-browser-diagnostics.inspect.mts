/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { copyFile, mkdir, rm, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import * as util from './utility.mts';
import * as heapSnapshotUtil from './heap-snapshot-util.mts';
import { HeadlessChromeController, summarizeBrowserDiagnostics, summarizeNetwork } from './chrome.mts';
import type { BrowserMeasurement, NetworkRequest, NetworkSummary } from './chrome.mts';
import { closeUserSetupDialog, postNote, signupThroughUi, visitHome } from '../../packages/frontend/test/e2e/shared.ts';

const [baseDirArg, headDirArg, baseOutputArg, headOutputArg] = process.argv.slice(2);

const baseUrl = process.env.FRONTEND_BROWSER_METRICS_URL ?? 'http://127.0.0.1:61812';
const sampleCount = util.readIntegerEnv('FRONTEND_BROWSER_METRICS_SAMPLE_COUNT', 5, 1);
const heapSnapshotBreakdownTopN = util.readIntegerEnv('FRONTEND_BROWSER_HEAP_SNAPSHOT_BREAKDOWN_TOP_N', heapSnapshotUtil.defaultHeapSnapshotBreakdownTopN, 1);
const heapSnapshotWorkDirs = {
	base: resolve('frontend-browser-base-heap-snapshots'),
	head: resolve('frontend-browser-head-heap-snapshots'),
} as const;
const heapSnapshotOutputPaths = {
	base: resolve('base-heap-snapshot.heapsnapshot'),
	head: resolve('head-heap-snapshot.heapsnapshot'),
} as const;

type BrowserMeasurementSample = BrowserMeasurement & {
	round: number;
	networkRequests: NetworkRequest[];
};

type BrowserMetricsReport = {
	label: string;
	timestamp: string;
	url: string;
	scenario: string;
	sampleCount: number;
	aggregation: 'median';
	summary: BrowserMeasurement;
	samples: BrowserMeasurementSample[];
};

async function runSignupAndPostScenario(chrome: HeadlessChromeController) {
	const page = chrome.page;
	const noteText = `Frontend browser metrics ${Date.now()}`;

	await visitHome(page, baseUrl);
	await signupThroughUi(page, { username: 'alice', password: 'password' });
	await closeUserSetupDialog(page);
	await postNote(page, noteText, 10_000);

	await util.sleep(1000);
}

function finiteMedian(values: (number | null | undefined)[], defaultValue = 0) {
	const finiteValues = values.filter(value => Number.isFinite(value)) as number[];
	if (finiteValues.length === 0) return defaultValue;
	return util.median(finiteValues);
}

function selectRepresentativeSample(samples: BrowserMeasurementSample[], getValue: (sample: BrowserMeasurementSample) => number) {
	const medianValue = finiteMedian(samples.map(getValue));
	let selected: { sample: BrowserMeasurementSample; distance: number } | null = null;

	for (const sample of samples) {
		const value = getValue(sample);
		if (!Number.isFinite(value)) continue;
		const distance = Math.abs(value - medianValue);
		if (selected == null || distance < selected.distance || (distance === selected.distance && sample.round < selected.sample.round)) {
			selected = {
				sample,
				distance,
			};
		}
	}

	return selected?.sample ?? samples[0];
}

function summarizeResourceType(samples: BrowserMeasurementSample[], resourceType: string) {
	return {
		requests: finiteMedian(samples.map(sample => sample.network.byResourceType[resourceType]?.requests)),
		encodedBytes: finiteMedian(samples.map(sample => sample.network.byResourceType[resourceType]?.encodedBytes)),
		decodedBodyBytes: finiteMedian(samples.map(sample => sample.network.byResourceType[resourceType]?.decodedBodyBytes)),
	};
}

function summarizeNetworkSamples(samples: BrowserMeasurementSample[]): NetworkSummary {
	const resourceTypes = new Set<string>();
	for (const sample of samples) {
		for (const resourceType of Object.keys(sample.network.byResourceType)) {
			resourceTypes.add(resourceType);
		}
	}

	const representative = selectRepresentativeSample(samples, sample => sample.network.totalEncodedBytes);
	const byResourceType = {} as NetworkSummary['byResourceType'];
	for (const resourceType of resourceTypes) {
		byResourceType[resourceType] = summarizeResourceType(samples, resourceType);
	}

	return {
		requestCount: finiteMedian(samples.map(sample => sample.network.requestCount)),
		webSocketConnectionCount: finiteMedian(samples.map(sample => sample.network.webSocketConnectionCount)),
		webSocketSentBytes: finiteMedian(samples.map(sample => sample.network.webSocketSentBytes)),
		webSocketReceivedBytes: finiteMedian(samples.map(sample => sample.network.webSocketReceivedBytes)),
		finishedRequestCount: finiteMedian(samples.map(sample => sample.network.finishedRequestCount)),
		failedRequestCount: finiteMedian(samples.map(sample => sample.network.failedRequestCount)),
		cachedRequestCount: finiteMedian(samples.map(sample => sample.network.cachedRequestCount)),
		serviceWorkerRequestCount: finiteMedian(samples.map(sample => sample.network.serviceWorkerRequestCount)),
		totalEncodedBytes: finiteMedian(samples.map(sample => sample.network.totalEncodedBytes)),
		totalDecodedBodyBytes: finiteMedian(samples.map(sample => sample.network.totalDecodedBodyBytes)),
		sameOriginEncodedBytes: finiteMedian(samples.map(sample => sample.network.sameOriginEncodedBytes)),
		thirdPartyEncodedBytes: finiteMedian(samples.map(sample => sample.network.thirdPartyEncodedBytes)),
		byResourceType,
		largestRequests: representative.network.largestRequests,
		failedRequests: representative.network.failedRequests,
	};
}

function summarizePerformanceSamples(samples: BrowserMeasurementSample[]): BrowserMeasurement['performance'] {
	const cdpMetricKeys = new Set<string>();
	for (const sample of samples) {
		for (const key of Object.keys(sample.performance.cdpMetrics)) {
			cdpMetricKeys.add(key);
		}
	}

	const cdpMetrics = {} as Record<string, number>;
	for (const key of cdpMetricKeys) {
		cdpMetrics[key] = finiteMedian(samples.map(sample => sample.performance.cdpMetrics[key]));
	}

	const webVitalKeys = [
		'firstPaintMs',
		'firstContentfulPaintMs',
		'domContentLoadedEventEndMs',
		'loadEventEndMs',
		'longTaskCount',
		'longTaskDurationMs',
		'maxLongTaskDurationMs',
		'resourceEntryCount',
		'domElements',
	] as const satisfies (keyof BrowserMeasurement['performance']['webVitals'])[];

	const webVitals = {} as BrowserMeasurement['performance']['webVitals'];
	for (const key of webVitalKeys) {
		webVitals[key] = finiteMedian(samples.map(sample => sample.performance.webVitals[key]));
	}

	return {
		cdpMetrics,
		runtimeHeap: {
			usedSize: finiteMedian(samples.map(sample => sample.performance.runtimeHeap?.usedSize)),
			totalSize: finiteMedian(samples.map(sample => sample.performance.runtimeHeap?.totalSize)),
		},
		tabMemory: {
			totalBytes: finiteMedian(samples.map(sample => sample.performance.tabMemory.totalBytes)),
		},
		webVitals,
	};
}

function summarizeHeapSnapshotSamples(samples: BrowserMeasurementSample[]) {
	const summary = heapSnapshotUtil.summarizeHeapSnapshotDataSamples(
		samples,
		sample => sample.heapSnapshot,
		{ breakdownTopN: heapSnapshotBreakdownTopN },
	);
	if (summary == null) throw new Error('No heap snapshot samples');
	return summary;
}

function summarizeSamples(label: 'base' | 'head', samples: BrowserMeasurementSample[]): BrowserMetricsReport {
	if (samples.length === 0) throw new Error(`No browser metric samples for ${label}`);
	const representative = selectRepresentativeSample(samples, sample => sample.network.totalEncodedBytes);
	const summary: BrowserMeasurement = {
		label,
		timestamp: new Date().toISOString(),
		url: baseUrl,
		scenario: representative.scenario,
		diagnostics: summarizeBrowserDiagnostics(samples.map(sample => sample.diagnostics)),
		durationMs: finiteMedian(samples.map(sample => sample.durationMs)),
		network: summarizeNetworkSamples(samples),
		performance: summarizePerformanceSamples(samples),
		heapSnapshot: summarizeHeapSnapshotSamples(samples),
	};

	return {
		label,
		timestamp: new Date().toISOString(),
		url: baseUrl,
		scenario: representative.scenario,
		sampleCount: samples.length,
		aggregation: 'median',
		summary,
		samples,
	};
}

async function measureSample(label: 'base' | 'head', round: number, heapSnapshotSavePath?: string) {
	await util.prepareInstance(baseUrl);

	return await HeadlessChromeController.with(label, { scenarioTimeoutMs: 120000, baseUrl }, async chrome => {
		await chrome.enableNetworkTracking();

		const startedAt = Date.now();
		await runSignupAndPostScenario(chrome);
		const durationMs = Date.now() - startedAt;
		await chrome.waitForNetworkDetails();
		const performance = await chrome.collectPerformance();
		const heapSnapshotRaw = await chrome.takeHeapSnapshot(heapSnapshotSavePath);
		const heapSnapshot = heapSnapshotUtil.analyzeHeapSnapshot(heapSnapshotRaw, { breakdownTopN: heapSnapshotBreakdownTopN });
		const measurement: BrowserMeasurementSample = {
			label,
			round,
			timestamp: new Date().toISOString(),
			url: baseUrl,
			scenario: 'fresh browser signup, first timeline note, after the note becomes visible',
			diagnostics: chrome.collectDiagnostics(),
			durationMs,
			network: summarizeNetwork(chrome.networkRequests, baseUrl, chrome.webSocketConnections),
			networkRequests: chrome.networkRequests,
			performance,
			heapSnapshot,
		};

		return measurement;
	});
}

function heapSnapshotPath(label: 'base' | 'head', round: number) {
	return join(heapSnapshotWorkDirs[label], `round-${round}.heapsnapshot`);
}

async function saveRepresentativeHeapSnapshot(label: 'base' | 'head', report: BrowserMetricsReport) {
	const representative = selectRepresentativeSample(report.samples, sample => sample.heapSnapshot.categories.total);
	await copyFile(heapSnapshotPath(label, representative.round), heapSnapshotOutputPaths[label]);
	process.stderr.write(`[${label}] Selected round ${representative.round} heap snapshot for artifact\n`);
	await rm(heapSnapshotWorkDirs[label], { recursive: true, force: true });
}

async function genReport(label: 'base' | 'head', repoDir: string, outputPath: string) {
	let server: ReturnType<typeof util.startServer> | null = null;

	try {
		server = util.startServer(label, repoDir);
		await util.waitForServer(baseUrl, server);

		await rm(heapSnapshotWorkDirs[label], { recursive: true, force: true });
		await mkdir(heapSnapshotWorkDirs[label], { recursive: true });

		const samples: BrowserMeasurementSample[] = [];
		for (let round = 1; round <= sampleCount; round++) {
			process.stderr.write(`[${label}] Measuring browser metrics sample ${round}/${sampleCount}\n`);
			samples.push(await measureSample(
				label,
				round,
				heapSnapshotPath(label, round),
			));
		}

		const report = summarizeSamples(label, samples);
		await writeFile(outputPath, JSON.stringify(report, null, '\t'));
		process.stderr.write(`[${label}] Wrote browser metrics report to ${outputPath}\n`);

		await saveRepresentativeHeapSnapshot(label, report);
	} finally {
		if (server != null) await util.stopServer(server);
	}
}

async function main() {
	await genReport('base', resolve(baseDirArg), resolve(baseOutputArg));
	await genReport('head', resolve(headDirArg), resolve(headOutputArg));
}

await main();
