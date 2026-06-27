/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as util from './utility.mts';
import * as heapSnapshotUtil from './heap-snapshot-util.mts';
import type { HeapSnapshotData } from './heap-snapshot-util.mts';

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

function formatDelta(value: number, formatter: (value: number) => string) {
	if (value === 0) return formatter(0);
	return util.formatColoredDelta(formatter(Math.abs(value)), value);
}

function metricRow(label: string, baseValue: number | null | undefined, headValue: number | null | undefined, formatter: (value: number) => string) {
	if (baseValue == null || headValue == null || !Number.isFinite(baseValue) || !Number.isFinite(headValue)) return null;
	const delta = headValue - baseValue;
	return `| **${label}** | ${formatter(baseValue)} | ${formatter(headValue)} | ${formatDelta(delta, formatter)} | ${util.calcAndFormatDeltaPercent(baseValue, headValue).replaceAll('\\%', '\\\\%')} |`;
}

function resourceTypeBytes(report: BrowserMeasurement, resourceTypes: string[]) {
	return resourceTypes.reduce((sum, resourceType) => sum + (report.network.byResourceType[resourceType]?.encodedBytes ?? 0), 0);
}

function getMetric(report: BrowserMeasurement, key: string) {
	return report.performance.cdpMetrics[key];
}

function renderSummaryTable(base: BrowserMeasurement, head: BrowserMeasurement) {
	const rows = [
		metricRow('Scenario duration', base.durationMs, head.durationMs, formatMs),
		metricRow('Requests', base.network.requestCount, head.network.requestCount, util.formatNumber),
		metricRow('Failed requests', base.network.failedRequestCount, head.network.failedRequestCount, util.formatNumber),
		metricRow('Encoded network', base.network.totalEncodedBytes, head.network.totalEncodedBytes, util.formatBytes),
		metricRow('Decoded body', base.network.totalDecodedBodyBytes, head.network.totalDecodedBodyBytes, util.formatBytes),
		metricRow('Same-origin encoded', base.network.sameOriginEncodedBytes, head.network.sameOriginEncodedBytes, util.formatBytes),
		metricRow('Third-party encoded', base.network.thirdPartyEncodedBytes, head.network.thirdPartyEncodedBytes, util.formatBytes),
		metricRow('Script encoded', resourceTypeBytes(base, ['Script']), resourceTypeBytes(head, ['Script']), util.formatBytes),
		metricRow('Stylesheet encoded', resourceTypeBytes(base, ['Stylesheet']), resourceTypeBytes(head, ['Stylesheet']), util.formatBytes),
		metricRow('Fetch/XHR encoded', resourceTypeBytes(base, ['Fetch', 'XHR']), resourceTypeBytes(head, ['Fetch', 'XHR']), util.formatBytes),
		metricRow('Image encoded', resourceTypeBytes(base, ['Image']), resourceTypeBytes(head, ['Image']), util.formatBytes),
		metricRow('Font encoded', resourceTypeBytes(base, ['Font']), resourceTypeBytes(head, ['Font']), util.formatBytes),
		metricRow('First contentful paint', base.performance.webVitals.firstContentfulPaintMs, head.performance.webVitals.firstContentfulPaintMs, formatMs),
		metricRow('Load event end', base.performance.webVitals.loadEventEndMs, head.performance.webVitals.loadEventEndMs, formatMs),
		metricRow('Long tasks', base.performance.webVitals.longTaskCount, head.performance.webVitals.longTaskCount, util.formatNumber),
		metricRow('Long task duration', base.performance.webVitals.longTaskDurationMs, head.performance.webVitals.longTaskDurationMs, formatMs),
		metricRow('Max long task', base.performance.webVitals.maxLongTaskDurationMs, head.performance.webVitals.maxLongTaskDurationMs, formatMs),
		metricRow('JS heap used', base.performance.runtimeHeap?.usedSize ?? getMetric(base, 'JSHeapUsedSize'), head.performance.runtimeHeap?.usedSize ?? getMetric(head, 'JSHeapUsedSize'), util.formatBytes),
		metricRow('JS heap total', base.performance.runtimeHeap?.totalSize ?? getMetric(base, 'JSHeapTotalSize'), head.performance.runtimeHeap?.totalSize ?? getMetric(head, 'JSHeapTotalSize'), util.formatBytes),
		metricRow('V8 heap snapshot total', base.heapSnapshot.categories.total, head.heapSnapshot.categories.total, util.formatBytes),
		metricRow('DOM elements', base.performance.webVitals.domElements, head.performance.webVitals.domElements, util.formatNumber),
		metricRow('CDP nodes', getMetric(base, 'Nodes'), getMetric(head, 'Nodes'), util.formatNumber),
		metricRow('JS event listeners', getMetric(base, 'JSEventListeners'), getMetric(head, 'JSEventListeners'), util.formatNumber),
		metricRow('Layout count', getMetric(base, 'LayoutCount'), getMetric(head, 'LayoutCount'), util.formatNumber),
		metricRow('Recalc style count', getMetric(base, 'RecalcStyleCount'), getMetric(head, 'RecalcStyleCount'), util.formatNumber),
		metricRow('Script duration', getMetric(base, 'ScriptDuration'), getMetric(head, 'ScriptDuration'), formatSecondsAsMs),
		metricRow('Task duration', getMetric(base, 'TaskDuration'), getMetric(head, 'TaskDuration'), formatSecondsAsMs),
	].filter(row => row != null);

	return [
		'| Metric | Base | Head | Δ | Δ (%) |',
		'| --- | ---: | ---: | ---: | ---: |',
		...rows,
	].join('\n');
}

function renderResourceTypeTable(base: BrowserMeasurement, head: BrowserMeasurement) {
	const preferredOrder = ['Document', 'Script', 'Stylesheet', 'Fetch', 'XHR', 'Image', 'Font', 'Media', 'WebSocket', 'EventSource', 'Other'];
	const keys = [...new Set([
		...preferredOrder,
		...Object.keys(base.network.byResourceType),
		...Object.keys(head.network.byResourceType),
	])].filter(key => base.network.byResourceType[key] != null || head.network.byResourceType[key] != null);

	const lines = [
		'| Type | Base reqs | Head reqs | Δ reqs | Base encoded | Head encoded | Δ encoded |',
		'| --- | ---: | ---: | ---: | ---: | ---: | ---: |',
	];

	for (const key of keys) {
		const baseRow = base.network.byResourceType[key] ?? { requests: 0, encodedBytes: 0 };
		const headRow = head.network.byResourceType[key] ?? { requests: 0, encodedBytes: 0 };
		lines.push(`| **${key}** | ${util.formatNumber(baseRow.requests)} | ${util.formatNumber(headRow.requests)} | ${formatDelta(headRow.requests - baseRow.requests, util.formatNumber)} | ${util.formatBytes(baseRow.encodedBytes)} | ${util.formatBytes(headRow.encodedBytes)} | ${formatDelta(headRow.encodedBytes - baseRow.encodedBytes, util.formatBytes)} |`);
	}

	return lines.join('\n');
}

function renderHeapSnapshotTable(base: BrowserMeasurement, head: BrowserMeasurement) {
	const lines = [
		'| Category | Base | Head | Δ | Δ (%) | Base nodes | Head nodes |',
		'| --- | ---: | ---: | ---: | ---: | ---: | ---: |',
	];

	for (const category of Object.keys(heapSnapshotUtil.heapSnapshotCategory) as (keyof typeof heapSnapshotUtil.heapSnapshotCategory)[]) {
		const baseValue = base.heapSnapshot.categories[category];
		const headValue = head.heapSnapshot.categories[category];
		const baseNodeCount = base.heapSnapshot.nodeCounts[category];
		const headNodeCount = head.heapSnapshot.nodeCounts[category];
		const categoryInfo = heapSnapshotUtil.heapSnapshotCategory[category];
		const metricText = `$\\color{${categoryInfo.color}}{\\rule{8pt}{8pt}}$ **${categoryInfo.label}**`;
		lines.push(`| ${metricText} | ${util.formatBytes(baseValue)} | ${util.formatBytes(headValue)} | ${formatDelta(headValue - baseValue, util.formatBytes)} | ${util.calcAndFormatDeltaPercent(baseValue, headValue).replaceAll('\\%', '\\\\%')} | ${util.formatNumber(baseNodeCount)} | ${util.formatNumber(headNodeCount)} |`);
	}

	return lines.join('\n');
}

function renderLargestRequests(report: BrowserMeasurement, title: string) {
	if (report.network.largestRequests.length === 0) return null;

	const lines = [
		`<details><summary>${title}</summary>`,
		'',
		'| Resource | Type | Status | Encoded | Decoded |',
		'| --- | --- | ---: | ---: | ---: |',
	];

	for (const request of report.network.largestRequests.slice(0, 10)) {
		lines.push(`| \`${escapeCell(truncate(request.url))}\` | ${escapeCell(request.resourceType)} | ${request.status ?? '-'} | ${util.formatBytes(request.encodedBytes)} | ${util.formatBytes(request.decodedBodyBytes)} |`);
	}

	lines.push('', '</details>');
	return lines.join('\n');
}

function renderFailedRequests(report: BrowserMeasurement, title: string) {
	if (report.network.failedRequests.length === 0) return null;

	const lines = [
		`<details><summary>${title}</summary>`,
		'',
		'| Resource | Type | Status | Error |',
		'| --- | --- | ---: | --- |',
	];

	for (const request of report.network.failedRequests.slice(0, 20)) {
		lines.push(`| \`${escapeCell(truncate(request.url))}\` | ${escapeCell(request.resourceType)} | ${request.status ?? '-'} | ${escapeCell(request.errorText ?? '')} |`);
	}

	lines.push('', '</details>');
	return lines.join('\n');
}

function renderHeadHeapSankey(head: BrowserMeasurement) {
	return heapSnapshotUtil.renderHeapSnapshotSankey({
		summary: head.heapSnapshot,
		samples: [{
			round: 1,
			data: head.heapSnapshot,
		}],
	}, 'Head browser');
}

export function renderFrontendBrowserReport(base: BrowserMeasurement, head: BrowserMeasurement, options: {
	headHeapSnapshotUrl?: string;
} = {}) {
	const headHeapSnapshotUrl = options.headHeapSnapshotUrl;
	const lines = [
		'## Frontend Browser Metrics',
		'',
		renderSummaryTable(base, head),
		'',
		'_Measured once per side with a fresh headless Chrome profile, browser cache disabled, service workers bypassed, and a forced V8 GC before the heap snapshot. Scenario: sign up, dismiss the initial account setup dialog, create the first timeline note, then wait until that note is visible._',
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
		renderHeapSnapshotTable(base, head),
		'',
		...(headHeapSnapshotUrl != null && headHeapSnapshotUrl !== '' ? [`[Download head heap snapshot](${headHeapSnapshotUrl})`, ''] : []),
		'</details>',
		'',
	];

	for (const section of [
		renderHeadHeapSankey(head),
		renderLargestRequests(head, 'Largest head requests'),
		renderFailedRequests(base, 'Failed base requests'),
		renderFailedRequests(head, 'Failed head requests'),
	]) {
		if (section == null) continue;
		lines.push(section, '');
	}

	return lines.join('\n').trimEnd() + '\n';
}
