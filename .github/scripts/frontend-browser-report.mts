/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import * as util from './utility.mts';
import * as heapSnapshotUtil from './heap-snapshot-util.mts';
import type { HeapSnapshotData, HeapSnapshotReport } from './heap-snapshot-util.mts';

export type BrowserMeasurement = {
	label: string;
	timestamp: string;
	url: string;
	scenario: string;
	durationMs: number;
	network: {
		requestCount: number;
		finishedRequestCount: number;
		failedRequestCount: number;
		cachedRequestCount: number;
		serviceWorkerRequestCount: number;
		totalEncodedBytes: number;
		totalDecodedBodyBytes: number;
		sameOriginEncodedBytes: number;
		thirdPartyEncodedBytes: number;
		byResourceType: Record<string, {
			requests: number;
			encodedBytes: number;
			decodedBodyBytes: number;
		}>;
		largestRequests: {
			url: string;
			method: string;
			resourceType: string;
			status?: number;
			encodedBytes: number;
			decodedBodyBytes: number;
		}[];
		failedRequests: {
			url: string;
			method: string;
			resourceType: string;
			errorText?: string;
			status?: number;
		}[];
	};
	performance: {
		cdpMetrics: Record<string, number>;
		runtimeHeap?: {
			usedSize: number;
			totalSize: number;
		};
		webVitals: {
			firstPaintMs?: number;
			firstContentfulPaintMs?: number;
			domContentLoadedEventEndMs?: number;
			loadEventEndMs?: number;
			longTaskCount: number;
			longTaskDurationMs: number;
			maxLongTaskDurationMs: number;
			resourceEntryCount: number;
			domElements: number;
		};
	};
	heapSnapshot: HeapSnapshotData;
};

export type BrowserMeasurementSample = BrowserMeasurement & {
	round: number;
};

export type BrowserMetricsReport = {
	label: string;
	timestamp: string;
	url: string;
	scenario: string;
	sampleCount: number;
	aggregation: 'median';
	summary: BrowserMeasurement;
	samples: BrowserMeasurementSample[];
};

function escapeCell(value: string) {
	return String(value).replaceAll('|', '\\|').replaceAll('\n', '<br>');
}

function truncate(value: string, maxLength = 140) {
	if (value.length <= maxLength) return value;
	return `${value.slice(0, maxLength - 3)}...`;
}

function formatMs(value: number | null | undefined) {
	if (value == null || !Number.isFinite(value)) return '-';
	if (value >= 1_000) return `${util.formatNumber(value / 1_000)} s`;
	return `${util.formatNumber(value)} ms`;
}

function formatSecondsAsMs(value: number | null | undefined) {
	if (value == null || !Number.isFinite(value)) return '-';
	return formatMs(value * 1_000);
}

function formatDelta(delta: number, formatter: (value: number) => string, colorThreshold = 0) {
	if (delta === 0) return formatter(0);
	return util.formatColoredDelta(delta, v => formatter(v), colorThreshold);
}

function finiteValues(values: (number | null | undefined)[]) {
	return values.filter(value => Number.isFinite(value)) as number[];
}

function sampleSpread(report: BrowserMetricsReport, getValue: (sample: BrowserMeasurementSample) => number | null | undefined) {
	const values = finiteValues(report.samples.map(sample => getValue(sample)));
	if (values.length < 2) return null;

	const center = util.median(values);
	return util.median(values.map(value => Math.abs(value - center)));
}

function formatValueWithSpread(report: BrowserMetricsReport, value: number, getSampleValue: (sample: BrowserMeasurementSample) => number | null | undefined, formatter: (value: number) => string) {
	const spread = sampleSpread(report, getSampleValue);
	if (spread == null) return formatter(value);
	return `${formatter(value)}<br>± ${formatter(spread)}`;
}

function pairedDelta(reportBase: BrowserMetricsReport, reportHead: BrowserMetricsReport, getValue: (sample: BrowserMeasurementSample) => number | null | undefined) {
	try {
		return util.pairedDeltaSummary(reportBase.samples, reportHead.samples, sample => getValue(sample) ?? null);
	} catch {
		return null;
	}
}

function metricRow(
	label: string,
	base: BrowserMetricsReport,
	head: BrowserMetricsReport,
	getSummaryValue: (summary: BrowserMeasurement) => number | null | undefined,
	getSampleValue: (sample: BrowserMeasurementSample) => number | null | undefined,
	formatter: (value: number) => string,
) {
	const baseValue = getSummaryValue(base.summary);
	const headValue = getSummaryValue(head.summary);
	if (baseValue == null || headValue == null || !Number.isFinite(baseValue) || !Number.isFinite(headValue)) return null;

	const summary = pairedDelta(base, head, getSampleValue);
	const percent = summary == null || baseValue === 0 ? null : summary.median * 100 / baseValue;
	const deltaMedian = summary == null
		? '-'
		: `${formatDelta(summary.median, formatter)}<br>${percent == null ? '-' : util.formatDeltaPercent(percent).replaceAll('\\%', '\\\\%')}`;

	return `| **${label}** | ${formatValueWithSpread(base, baseValue, getSampleValue, formatter)} | ${formatValueWithSpread(head, headValue, getSampleValue, formatter)} | ${deltaMedian} | ${summary == null ? '-' : formatter(summary.mad)} | ${summary == null ? '-' : formatDelta(summary.min, formatter)} | ${summary == null ? '-' : formatDelta(summary.max, formatter)} |`;
}

function resourceTypeBytes(report: BrowserMeasurement, resourceTypes: string[]) {
	return resourceTypes.reduce((sum, resourceType) => sum + (report.network.byResourceType[resourceType]?.encodedBytes ?? 0), 0);
}

function resourceTypeSampleBytes(sample: BrowserMeasurementSample, resourceTypes: string[]) {
	return resourceTypeBytes(sample, resourceTypes);
}

function getMetric(report: BrowserMeasurement, key: string) {
	return report.performance.cdpMetrics[key];
}

function renderSummaryTable(base: BrowserMetricsReport, head: BrowserMetricsReport) {
	const rows = [
		//metricRow('Scenario duration', base, head, summary => summary.durationMs, sample => sample.durationMs, formatMs),
		metricRow('Requests', base, head, summary => summary.network.requestCount, sample => sample.network.requestCount, util.formatNumber),
		metricRow('Failed requests', base, head, summary => summary.network.failedRequestCount, sample => sample.network.failedRequestCount, util.formatNumber),
		metricRow('Encoded network', base, head, summary => summary.network.totalEncodedBytes, sample => sample.network.totalEncodedBytes, util.formatBytes),
		metricRow('Decoded body', base, head, summary => summary.network.totalDecodedBodyBytes, sample => sample.network.totalDecodedBodyBytes, util.formatBytes),
		metricRow('Same-origin encoded', base, head, summary => summary.network.sameOriginEncodedBytes, sample => sample.network.sameOriginEncodedBytes, util.formatBytes),
		metricRow('Third-party encoded', base, head, summary => summary.network.thirdPartyEncodedBytes, sample => sample.network.thirdPartyEncodedBytes, util.formatBytes),
		metricRow('Script encoded', base, head, summary => resourceTypeBytes(summary, ['Script']), sample => resourceTypeSampleBytes(sample, ['Script']), util.formatBytes),
		metricRow('Stylesheet encoded', base, head, summary => resourceTypeBytes(summary, ['Stylesheet']), sample => resourceTypeSampleBytes(sample, ['Stylesheet']), util.formatBytes),
		metricRow('Fetch/XHR encoded', base, head, summary => resourceTypeBytes(summary, ['Fetch', 'XHR']), sample => resourceTypeSampleBytes(sample, ['Fetch', 'XHR']), util.formatBytes),
		metricRow('Image encoded', base, head, summary => resourceTypeBytes(summary, ['Image']), sample => resourceTypeSampleBytes(sample, ['Image']), util.formatBytes),
		metricRow('Font encoded', base, head, summary => resourceTypeBytes(summary, ['Font']), sample => resourceTypeSampleBytes(sample, ['Font']), util.formatBytes),
		//metricRow('First contentful paint', base, head, summary => summary.performance.webVitals.firstContentfulPaintMs, sample => sample.performance.webVitals.firstContentfulPaintMs, formatMs),
		//metricRow('Load event end', base, head, summary => summary.performance.webVitals.loadEventEndMs, sample => sample.performance.webVitals.loadEventEndMs, formatMs),
		//metricRow('Long tasks', base, head, summary => summary.performance.webVitals.longTaskCount, sample => sample.performance.webVitals.longTaskCount, util.formatNumber),
		//metricRow('Long task duration', base, head, summary => summary.performance.webVitals.longTaskDurationMs, sample => sample.performance.webVitals.longTaskDurationMs, formatMs),
		//metricRow('Max long task', base, head, summary => summary.performance.webVitals.maxLongTaskDurationMs, sample => sample.performance.webVitals.maxLongTaskDurationMs, formatMs),
		//metricRow('JS heap used', base, head, summary => summary.performance.runtimeHeap?.usedSize ?? getMetric(summary, 'JSHeapUsedSize'), sample => sample.performance.runtimeHeap?.usedSize ?? getMetric(sample, 'JSHeapUsedSize'), util.formatBytes),
		//metricRow('JS heap total', base, head, summary => summary.performance.runtimeHeap?.totalSize ?? getMetric(summary, 'JSHeapTotalSize'), sample => sample.performance.runtimeHeap?.totalSize ?? getMetric(sample, 'JSHeapTotalSize'), util.formatBytes),
		//metricRow('V8 heap snapshot total', base, head, summary => summary.heapSnapshot.categories.total, sample => sample.heapSnapshot.categories.total, util.formatBytes),
		metricRow('DOM elements', base, head, summary => summary.performance.webVitals.domElements, sample => sample.performance.webVitals.domElements, util.formatNumber),
		//metricRow('CDP nodes', base, head, summary => getMetric(summary, 'Nodes'), sample => getMetric(sample, 'Nodes'), util.formatNumber),
		//metricRow('JS event listeners', base, head, summary => getMetric(summary, 'JSEventListeners'), sample => getMetric(sample, 'JSEventListeners'), util.formatNumber),
		//metricRow('Layout count', base, head, summary => getMetric(summary, 'LayoutCount'), sample => getMetric(sample, 'LayoutCount'), util.formatNumber),
		//metricRow('Recalc style count', base, head, summary => getMetric(summary, 'RecalcStyleCount'), sample => getMetric(sample, 'RecalcStyleCount'), util.formatNumber),
		//metricRow('Script duration', base, head, summary => getMetric(summary, 'ScriptDuration'), sample => getMetric(sample, 'ScriptDuration'), formatSecondsAsMs),
		//metricRow('Task duration', base, head, summary => getMetric(summary, 'TaskDuration'), sample => getMetric(sample, 'TaskDuration'), formatSecondsAsMs),
	].filter(row => row != null);

	return [
		'| Metric | Base | Head | Δ median | Δ MAD | Δ min | Δ max |',
		'| --- | ---: | ---: | ---: | ---: | ---: | ---: |',
		...rows,
	].join('\n');
}

function renderResourceTypeTable(base: BrowserMetricsReport, head: BrowserMetricsReport) {
	const preferredOrder = ['Document', 'Script', 'Stylesheet', 'Fetch', 'XHR', 'Image', 'Font', 'Media', 'WebSocket', 'EventSource', 'Other'];
	const keys = [...new Set([
		...preferredOrder,
		...Object.keys(base.summary.network.byResourceType),
		...Object.keys(head.summary.network.byResourceType),
	])].filter(key => base.summary.network.byResourceType[key] != null || head.summary.network.byResourceType[key] != null);

	const lines = [
		'<table>',
		'<thead>',
		'<tr>',
		'<th rowspan="2">Type</th>',
		'<th colspan="3">Requests</th>',
		'<th colspan="3">Encoded bytes</th>',
		'</tr>',
		'<tr>',
		'<th>Base</th>',
		'<th>Head</th>',
		'<th>Δ</th>',
		'<th>Base</th>',
		'<th>Head</th>',
		'<th>Δ</th>',
		'</tr>',
		'</thead>',
		'<tbody>',
	];

	for (const key of keys) {
		const baseRow = base.summary.network.byResourceType[key] ?? { requests: 0, encodedBytes: 0 };
		const headRow = head.summary.network.byResourceType[key] ?? { requests: 0, encodedBytes: 0 };
		lines.push('<tr>');
		lines.push(`<td><b>${key}</b></td>`);
		lines.push(`<td style="text-align:right">${util.formatNumber(baseRow.requests)}</td>`);
		lines.push(`<td style="text-align:right">${util.formatNumber(headRow.requests)}</td>`);
		lines.push(`<td style="text-align:right">${formatDelta(headRow.requests - baseRow.requests, util.formatNumber)}</td>`);
		lines.push(`<td style="text-align:right">${util.formatBytes(baseRow.encodedBytes)}</td>`);
		lines.push(`<td style="text-align:right">${util.formatBytes(headRow.encodedBytes)}</td>`);
		lines.push(`<td style="text-align:right">${formatDelta(headRow.encodedBytes - baseRow.encodedBytes, util.formatBytes)}</td>`);
		lines.push('</tr>');
	}

	lines.push('</tbody>');
	lines.push('</table>');

	return lines.join('\n');
}

function renderLargestRequests(report: BrowserMetricsReport, title: string) {
	if (report.summary.network.largestRequests.length === 0) return null;

	const lines = [
		`<details><summary>${title}</summary>`,
		'',
		'| Resource | Type | Status | Encoded | Decoded |',
		'| --- | --- | ---: | ---: | ---: |',
	];

	for (const request of report.summary.network.largestRequests.slice(0, 10)) {
		lines.push(`| \`${escapeCell(truncate(request.url))}\` | ${escapeCell(request.resourceType)} | ${request.status ?? '-'} | ${util.formatBytes(request.encodedBytes)} | ${util.formatBytes(request.decodedBodyBytes)} |`);
	}

	lines.push('', '</details>');
	return lines.join('\n');
}

function renderFailedRequests(report: BrowserMetricsReport, title: string) {
	if (report.summary.network.failedRequests.length === 0) return null;

	const lines = [
		`<details><summary>${title}</summary>`,
		'',
		'| Resource | Type | Status | Error |',
		'| --- | --- | ---: | --- |',
	];

	for (const request of report.summary.network.failedRequests.slice(0, 20)) {
		lines.push(`| \`${escapeCell(truncate(request.url))}\` | ${escapeCell(request.resourceType)} | ${request.status ?? '-'} | ${escapeCell(request.errorText ?? '')} |`);
	}

	lines.push('', '</details>');
	return lines.join('\n');
}

function toHeapSnapshotReport(report: BrowserMetricsReport): HeapSnapshotReport {
	return {
		summary: report.summary.heapSnapshot,
		samples: report.samples.map(sample => ({
			round: sample.round,
			data: sample.heapSnapshot,
		})),
	};
}

function renderHeadHeapSankey(head: BrowserMetricsReport) {
	return heapSnapshotUtil.renderHeapSnapshotSankey(toHeapSnapshotReport(head), 'Head browser');
}

export function renderFrontendBrowserReport(base: BrowserMetricsReport, head: BrowserMetricsReport, options: {
	headHeapSnapshotUrl?: string;
} = {}) {
	const headHeapSnapshotUrl = options.headHeapSnapshotUrl;
	const sampleSummary = base.sampleCount === head.sampleCount
		? `${base.sampleCount} samples per side`
		: `${base.sampleCount} base sample(s), ${head.sampleCount} head sample(s)`;
	const heapSnapshotTable = heapSnapshotUtil.renderHeapSnapshotTable(toHeapSnapshotReport(base), toHeapSnapshotReport(head));
	const lines = [
		'## 🖥 Frontend Browser Metrics',
		'',
		renderSummaryTable(base, head),
		'',
		`> Measured ${sampleSummary} with fresh headless Chrome profiles, browser cache disabled, service workers bypassed, and forced V8 GC before each heap snapshot. Base/Head values are medians; Δ median is the median of paired Head - Base sample deltas; percent uses Δ median / Base median; ± and Δ MAD are median absolute deviations. Scenario: sign up, dismiss the initial account setup dialog, create the first timeline note, then wait until that note is visible.`,
		'',
		'<details>',
		'<summary>Requests by resource type</summary>',
		'',
		renderResourceTypeTable(base, head),
		'',
		'</details>',
		'',
		'<details>',
		'<summary>V8 heap snapshot statistics</summary>',
		'',
		heapSnapshotTable ?? '_No V8 heap snapshot data._',
		'',
		...(headHeapSnapshotUrl != null && headHeapSnapshotUrl !== '' ? [`[Download representative head heap snapshot](${headHeapSnapshotUrl})`, ''] : []),
		'</details>',
		'',
	];

	for (const section of [
		renderHeadHeapSankey(head),
		renderLargestRequests(head, 'Largest representative head requests'),
		renderFailedRequests(base, 'Failed representative base requests'),
		renderFailedRequests(head, 'Failed representative head requests'),
	]) {
		if (section == null) continue;
		lines.push(section, '');
	}

	return lines.join('\n').trimEnd() + '\n';
}

async function main() {
	const [baseFile, headFile, outputFile] = process.argv.slice(2);
	if (baseFile == null || headFile == null || outputFile == null) {
		throw new Error('Usage: node frontend-browser-report.mts <base-browser.json> <head-browser.json> <output.md>');
	}

	const base = JSON.parse(await readFile(baseFile, 'utf8')) as BrowserMetricsReport;
	const head = JSON.parse(await readFile(headFile, 'utf8')) as BrowserMetricsReport;
	await writeFile(outputFile, renderFrontendBrowserReport(base, head, {
		headHeapSnapshotUrl: process.env.FRONTEND_BROWSER_HEAD_HEAP_SNAPSHOT_ARTIFACT_URL,
	}));
}

if (process.argv[1] != null && import.meta.url === pathToFileURL(process.argv[1]).href) {
	await main();
}
