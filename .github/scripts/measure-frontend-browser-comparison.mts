/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { spawn, spawnSync, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { copyFile, mkdir, rm, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import * as util from './utility.mts';
import * as heapSnapshotUtil from './heap-snapshot-util.mts';
import { Chrome, summarizeNetwork } from './chrome.mts';
import type { BrowserMeasurement, NetworkSummary } from './chrome.mts';

const [baseDirArg, headDirArg, baseOutputArg, headOutputArg, headHeapSnapshotOutputArg] = process.argv.slice(2);

const baseUrl = process.env.FRONTEND_BROWSER_METRICS_URL ?? 'http://127.0.0.1:61812';
const serverReadyTimeoutMs = util.readIntegerEnv('FRONTEND_BROWSER_METRICS_SERVER_READY_TIMEOUT_MS', 120_000, 1);
const scenarioTimeoutMs = util.readIntegerEnv('FRONTEND_BROWSER_METRICS_SCENARIO_TIMEOUT_MS', 90_000, 1);
const settleMs = util.readIntegerEnv('FRONTEND_BROWSER_METRICS_SETTLE_MS', 1_000, 0);
const sampleCount = util.readIntegerEnv('FRONTEND_BROWSER_METRICS_SAMPLE_COUNT', 5, 1);
const heapSnapshotBreakdownTopN = util.readIntegerEnv('FRONTEND_BROWSER_HEAP_SNAPSHOT_BREAKDOWN_TOP_N', heapSnapshotUtil.defaultHeapSnapshotBreakdownTopN, 1);
const headHeapSnapshotWorkDir = resolve('frontend-browser-head-heap-snapshots');

type BrowserMeasurementSample = BrowserMeasurement & {
	round: number;
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

function startServer(label: string, repoDir: string) {
	process.stderr.write(`[${label}] Starting Misskey test server\n`);
	const child = spawn(util.commandName('pnpm'), ['start:test'], {
		cwd: repoDir,
		env: process.env,
		stdio: ['ignore', 'pipe', 'pipe'],
		detached: process.platform !== 'win32',
	});
	child.stdout.on('data', data => process.stderr.write(`[server:${label}] ${data}`));
	child.stderr.on('data', data => process.stderr.write(`[server:${label}] ${data}`));
	return child;
}

async function stopServer(child: ChildProcessWithoutNullStreams) {
	if (child.exitCode != null) return;

	if (process.platform === 'win32') {
		spawnSync('taskkill', ['/pid', String(child.pid), '/t', '/f'], { stdio: 'ignore' });
	} else if (child.pid != null) {
		try {
			process.kill(-child.pid, 'SIGTERM');
		} catch {
			child.kill('SIGTERM');
		}
	}

	await new Promise<void>(resolvePromise => {
		if (child.exitCode != null) {
			resolvePromise();
			return;
		}
		child.once('exit', () => resolvePromise());
		setTimeout(() => {
			if (child.pid != null) {
				try {
					if (process.platform === 'win32') {
						spawnSync('taskkill', ['/pid', String(child.pid), '/t', '/f'], { stdio: 'ignore' });
					} else {
						process.kill(-child.pid, 'SIGKILL');
					}
				} catch {
					child.kill('SIGKILL');
				}
			}
			resolvePromise();
		}, 10_000).unref();
	});
}

async function waitForServer(child: ChildProcessWithoutNullStreams) {
	const startedAt = Date.now();
	while (Date.now() - startedAt < serverReadyTimeoutMs) {
		if (child.exitCode != null) throw new Error(`Misskey server exited early with code ${child.exitCode}`);
		try {
			const response = await fetch(`${baseUrl}/`, { redirect: 'manual' });
			if (response.status < 500) return;
		} catch {
			// retry
		}
		await util.sleep(1_000);
	}
	throw new Error(`Timed out waiting for ${baseUrl}`);
}

async function api(endpoint: string, body: Record<string, unknown>) {
	const response = await fetch(`${baseUrl}/api/${endpoint}`, {
		method: 'POST',
		headers: {
			'content-type': 'application/json',
		},
		body: JSON.stringify(body),
	});
	if (!response.ok) {
		throw new Error(`/api/${endpoint} returned ${response.status}: ${await response.text()}`);
	}
	if (response.status === 204) return null;
	return await response.json();
}

async function prepareInstance() {
	await api('reset-db', {});
	await api('admin/accounts/create', {
		username: 'admin',
		password: 'admin1234',
		setupPassword: 'example_password_please_change_this_or_you_will_get_hacked',
	});
}

async function runSignupAndPostScenario(chrome: Chrome) {
	const noteText = `Frontend browser metrics ${Date.now()}`;

	await chrome.cdp.send('Page.navigate', { url: `${baseUrl}/` });
	const initialSelector = await chrome.waitForAnySelector(['[data-cy-signup]', '[data-cy-open-post-form]'], { visible: true, timeoutMs: scenarioTimeoutMs });
	if (initialSelector == null) throw new Error('Timed out waiting for the signup or timeline entry point');

	if (await chrome.waitForSelector('[data-cy-signup]', { visible: true, enabled: true, timeoutMs: 5_000 })) {
		await chrome.click('[data-cy-signup]');

		if (await chrome.waitForSelector('[data-cy-signup-rules-continue]', { visible: true, timeoutMs: 5_000 })) {
			await chrome.click('[data-cy-signup-rules-notes-agree] [data-cy-switch-toggle]');
			await chrome.maybeClick('[data-cy-modal-dialog-ok]', 5_000);
			await chrome.click('[data-cy-signup-rules-continue]');
		}

		await chrome.setValue('[data-cy-signup-username] input', 'alice');
		await chrome.setValue('[data-cy-signup-password] input', 'alice1234');
		await chrome.setValue('[data-cy-signup-password-retype] input', 'alice1234');
		if (await chrome.waitForSelector('[data-cy-signup-invitation-code] input', { visible: true, enabled: true, timeoutMs: 2_000 })) {
			await chrome.setValue('[data-cy-signup-invitation-code] input', 'test-invitation-code');
		}
		await chrome.click('[data-cy-signup-submit]');
	}

	const firstReadySelector = await chrome.waitForAnySelector([
		'[data-cy-user-setup] [data-cy-modal-window-close]',
		'[data-cy-open-post-form]',
	], { visible: true, enabled: true, timeoutMs: scenarioTimeoutMs });
	if (firstReadySelector == null) throw new Error('Timed out waiting for signed-in home timeline');

	if (firstReadySelector === '[data-cy-user-setup] [data-cy-modal-window-close]') {
		await chrome.click('[data-cy-user-setup] [data-cy-modal-window-close]');
		await chrome.maybeClick('[data-cy-modal-dialog-ok]', 5_000);
	}

	await chrome.click('[data-cy-open-post-form]');
	await chrome.setValue('[data-cy-post-form-text]', noteText);
	await chrome.click('[data-cy-open-post-form-submit]');

	if (!await chrome.waitForText(noteText, scenarioTimeoutMs)) {
		throw new Error('The first timeline note did not appear');
	}

	await util.sleep(settleMs);
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
	await prepareInstance();

	return await Chrome.with(label, { scenarioTimeoutMs }, async chrome => {
		await chrome.enableNetworkTracking();

		const startedAt = Date.now();
		await runSignupAndPostScenario(chrome);
		const durationMs = Date.now() - startedAt;
		const performance = await chrome.collectPerformance();
		const heapSnapshotRaw = await chrome.takeHeapSnapshot(heapSnapshotSavePath);
		const heapSnapshot = heapSnapshotUtil.analyzeHeapSnapshot(heapSnapshotRaw, { breakdownTopN: heapSnapshotBreakdownTopN });
		const measurement: BrowserMeasurementSample = {
			label,
			round,
			timestamp: new Date().toISOString(),
			url: baseUrl,
			scenario: 'fresh browser signup, first timeline note, after the note becomes visible',
			durationMs,
			network: summarizeNetwork(chrome.networkRequests, baseUrl),
			performance,
			heapSnapshot,
		};

		return measurement;
	});
}

function headHeapSnapshotPath(round: number) {
	return join(headHeapSnapshotWorkDir, `round-${round}.heapsnapshot`);
}

async function saveRepresentativeHeadHeapSnapshot(report: BrowserMetricsReport, outputPath: string) {
	const representative = selectRepresentativeSample(report.samples, sample => sample.heapSnapshot.categories.total);
	await copyFile(headHeapSnapshotPath(representative.round), outputPath);
	process.stderr.write(`[head] Selected round ${representative.round} heap snapshot for artifact\n`);
	await rm(headHeapSnapshotWorkDir, { recursive: true, force: true });
}

async function measureRepo(label: 'base' | 'head', repoDir: string, outputPath: string, heapSnapshotSavePath?: string) {
	let server: ChildProcessWithoutNullStreams | null = null;

	try {
		server = startServer(label, repoDir);
		await waitForServer(server);

		if (label === 'head' && heapSnapshotSavePath != null) {
			await rm(headHeapSnapshotWorkDir, { recursive: true, force: true });
			await mkdir(headHeapSnapshotWorkDir, { recursive: true });
		}

		const samples: BrowserMeasurementSample[] = [];
		for (let round = 1; round <= sampleCount; round++) {
			process.stderr.write(`[${label}] Measuring browser metrics sample ${round}/${sampleCount}\n`);
			samples.push(await measureSample(
				label,
				round,
				label === 'head' && heapSnapshotSavePath != null ? headHeapSnapshotPath(round) : undefined,
			));
		}

		const report = summarizeSamples(label, samples);
		await writeFile(outputPath, JSON.stringify(report, null, '\t'));
		process.stderr.write(`[${label}] Wrote browser metrics report to ${outputPath}\n`);

		if (label === 'head' && heapSnapshotSavePath != null) {
			await saveRepresentativeHeadHeapSnapshot(report, heapSnapshotSavePath);
		}
	} finally {
		if (server != null) await stopServer(server);
	}
}

async function main() {
	await measureRepo('base', resolve(baseDirArg), resolve(baseOutputArg));
	await measureRepo('head', resolve(headDirArg), resolve(headOutputArg), headHeapSnapshotOutputArg == null ? undefined : resolve(headHeapSnapshotOutputArg));
}

await main();
