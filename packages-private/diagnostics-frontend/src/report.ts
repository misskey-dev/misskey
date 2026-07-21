/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { formatBytes, formatColoredDelta, formatDeltaPercentInMdTable, formatNumber } from 'diagnostics-shared/format';
import { renderHeapSnapshotTable, type HeapSnapshotReport } from 'diagnostics-shared/heap-snapshot';
import { independentDeltaSummary, type IndependentDeltaSummary, type IndependentDeltaVerdict } from 'diagnostics-shared/stats';
import { renderFrontendChunkReport } from './bundle/chunk-report';
import { collectVisualizerReport, renderVisualizerSummaryTable, type VisualizerReport } from './bundle/visualizer';
import type { CollectedBundleReport } from './bundle/manifest';
import type { BrowserMeasurementSample, BrowserMetricsReport } from './browser/types';

export type FrontendDiagnosticsMarkdownInput = {
	bundle: {
		base: CollectedBundleReport;
		head: CollectedBundleReport;
		baseStats: VisualizerReport;
		headStats: VisualizerReport;
		/** rollup-plugin-visualizer が出力したtreemap HTMLのartifact URL */
		visualizerArtifactUrl: string;
	};
	browser: {
		base: BrowserMetricsReport;
		head: BrowserMetricsReport;
		baseHeapSnapshotUrl: string;
		headHeapSnapshotUrl: string;
		detailedHtmlUrl?: string | null;
	};
};

const percentColorThreshold = 0.1;

function isDirectionalVerdict(verdict: IndependentDeltaVerdict) {
	return verdict === 'increase' || verdict === 'decrease';
}

function formatOptionalMetricValue(value: number | null, formatter: (value: number) => string) {
	return value == null ? '-' : formatter(value);
}

function formatMetricMedianWithMad(
	value: number | null,
	spread: number | null,
	formatter: (value: number) => string,
) {
	if (value == null) return '-';
	return `${formatter(value)} <br> ± ${formatOptionalMetricValue(spread, formatter)}`;
}

function formatMetricDelta(
	summary: IndependentDeltaSummary,
	formatter: (value: number) => string,
	absoluteThreshold: number,
) {
	if (summary.delta == null) return '-';
	return formatColoredDelta(
		summary.delta,
		formatter,
		isDirectionalVerdict(summary.verdict) ? absoluteThreshold : Number.POSITIVE_INFINITY,
	);
}

function formatMetricDeltaPercent(summary: IndependentDeltaSummary) {
	if (summary.baseMedian == null || summary.baseMedian === 0 || summary.delta == null) return '-';
	const percent = summary.delta * 100 / summary.baseMedian;
	return formatDeltaPercentInMdTable(
		percent,
		isDirectionalVerdict(summary.verdict) ? percentColorThreshold : Number.POSITIVE_INFINITY,
	);
}

function renderMetricRow(
	label: string,
	base: BrowserMetricsReport,
	head: BrowserMetricsReport,
	getSampleValue: (sample: BrowserMeasurementSample) => number,
	formatter: (value: number) => string,
	significantThreshold: number,
) {
	const summary = independentDeltaSummary(base.samples, head.samples, getSampleValue);
	if (!isDirectionalVerdict(summary.verdict) || summary.delta == null || Math.abs(summary.delta) < significantThreshold) return null;

	const delta = `${formatMetricDelta(summary, formatter, significantThreshold)}<br>${formatMetricDeltaPercent(summary)}`;
	return `| **${label}** | ${formatMetricMedianWithMad(summary.baseMedian, summary.baseMad, formatter)} | ${formatMetricMedianWithMad(summary.headMedian, summary.headMad, formatter)} | ${delta} | ${formatOptionalMetricValue(summary.combinedMad, formatter)} | ${summary.verdict} |`;
}

function resourceTypeSampleBytes(sample: BrowserMeasurementSample, resourceTypes: string[]) {
	return resourceTypes.reduce((sum, resourceType) => sum + (sample.network.byResourceType[resourceType]?.encodedBytes ?? 0), 0);
}

function renderBrowserSummaryTable(base: BrowserMetricsReport, head: BrowserMetricsReport) {
	//function getMetric(report: BrowserMeasurement, key: string) {
	//	return report.performance.cdpMetrics[key];
	//}

	const rows = [
		//renderMetricRow('Scenario duration', base, head, sample => sample.durationMs, formatMs, 0),
		renderMetricRow('Requests', base, head, sample => sample.network.requestCount, formatNumber, 1),
		//renderMetricRow('Failed requests', base, head, sample => sample.network.failedRequestCount, formatNumber, 1),
		renderMetricRow('Encoded network', base, head, sample => sample.network.totalEncodedBytes, formatBytes, 10_000),
		renderMetricRow('Decoded body', base, head, sample => sample.network.totalDecodedBodyBytes, formatBytes, 10_000),
		renderMetricRow('Same-origin encoded', base, head, sample => sample.network.sameOriginEncodedBytes, formatBytes, 10_000),
		renderMetricRow('Third-party encoded', base, head, sample => sample.network.thirdPartyEncodedBytes, formatBytes, 10_000),
		renderMetricRow('Script encoded', base, head, sample => resourceTypeSampleBytes(sample, ['Script']), formatBytes, 10_000),
		renderMetricRow('Stylesheet encoded', base, head, sample => resourceTypeSampleBytes(sample, ['Stylesheet']), formatBytes, 10_000),
		renderMetricRow('Fetch/XHR encoded', base, head, sample => resourceTypeSampleBytes(sample, ['Fetch', 'XHR']), formatBytes, 10_000),
		renderMetricRow('Image encoded', base, head, sample => resourceTypeSampleBytes(sample, ['Image']), formatBytes, 10_000),
		renderMetricRow('Font encoded', base, head, sample => resourceTypeSampleBytes(sample, ['Font']), formatBytes, 10_000),
		//renderMetricRow('First contentful paint', base, head, sample => sample.performance.webVitals.firstContentfulPaintMs, formatMs, 0),
		//renderMetricRow('Load event end', base, head, sample => sample.performance.webVitals.loadEventEndMs, formatMs, 0),
		//renderMetricRow('Long tasks', base, head, sample => sample.performance.webVitals.longTaskCount, formatNumber, 1),
		//renderMetricRow('Long task duration', base, head, sample => sample.performance.webVitals.longTaskDurationMs, formatMs, 0),
		//renderMetricRow('Max long task', base, head, sample => sample.performance.webVitals.maxLongTaskDurationMs, formatMs, 0),
		//renderMetricRow('JS heap used', base, head, sample => sample.performance.runtimeHeap?.usedSize ?? getMetric(sample, 'JSHeapUsedSize'), formatBytes, 10_000),
		//renderMetricRow('JS heap total', base, head, sample => sample.performance.runtimeHeap?.totalSize ?? getMetric(sample, 'JSHeapTotalSize'), formatBytes, 10_000),
		//renderMetricRow('V8 heap snapshot total', base, head, sample => sample.heapSnapshot.categories.total, formatBytes, 10_000),
		//renderMetricRow('DOM elements', base, head, sample => sample.performance.webVitals.domElements, formatNumber, 1),
		//renderMetricRow('CDP nodes', base, head, sample => getMetric(sample, 'Nodes'), formatNumber, 1),
		//renderMetricRow('JS event listeners', base, head, sample => getMetric(sample, 'JSEventListeners'), formatNumber, 1),
		//renderMetricRow('Layout count', base, head, sample => getMetric(sample, 'LayoutCount'), formatNumber, 1),
		//renderMetricRow('Recalc style count', base, head, sample => getMetric(sample, 'RecalcStyleCount'), formatNumber, 1),
		//renderMetricRow('Script duration', base, head, sample => getMetric(sample, 'ScriptDuration'), formatSecondsAsMs, 0),
		//renderMetricRow('Task duration', base, head, sample => getMetric(sample, 'TaskDuration'), formatSecondsAsMs, 0),
		renderMetricRow('WebSocket connections', base, head, sample => sample.network.webSocketConnectionCount, formatNumber, 1),
		renderMetricRow('WebSocket sent', base, head, sample => sample.network.webSocketSentBytes, formatBytes, 10_000),
		renderMetricRow('WebSocket received', base, head, sample => sample.network.webSocketReceivedBytes, formatBytes, 10_000),
		renderMetricRow('Page errors', base, head, sample => sample.diagnostics.pageErrorCount, formatNumber, 1),
		renderMetricRow('Console log', base, head, sample => sample.diagnostics.console.log, formatNumber, 1),
		renderMetricRow('Console warnings', base, head, sample => sample.diagnostics.console.warning, formatNumber, 1),
		renderMetricRow('Console errors', base, head, sample => sample.diagnostics.console.error, formatNumber, 1),
		renderMetricRow('Console info', base, head, sample => sample.diagnostics.console.info, formatNumber, 1),
		renderMetricRow('Page-attributed memory', base, head, sample => sample.performance.tabMemory.totalBytes, formatBytes, 10_000),
	].filter(row => row != null);

	return [
		'| Metric | @ Base | @ Head | Δ | MAD | Result |',
		'| --- | ---: | ---: | ---: | ---: | --- |',
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
		lines.push(`<td align="right">${formatNumber(baseRow.requests)}</td>`);
		lines.push(`<td align="right">${formatNumber(headRow.requests)}</td>`);
		lines.push(`<td align="right">${formatColoredDelta(headRow.requests - baseRow.requests, formatNumber)}</td>`);
		lines.push(`<td align="right">${formatBytes(baseRow.encodedBytes)}</td>`);
		lines.push(`<td align="right">${formatBytes(headRow.encodedBytes)}</td>`);
		lines.push(`<td align="right">${formatColoredDelta(headRow.encodedBytes - baseRow.encodedBytes, formatBytes)}</td>`);
		lines.push('</tr>');
	}

	lines.push('</tbody>');
	lines.push('</table>');

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

export function renderFrontendDiagnosticsMarkdown(input: FrontendDiagnosticsMarkdownInput) {
	const { bundle, browser } = input;
	const detailedHtmlUrl = browser.detailedHtmlUrl;
	const heapSnapshotTable = renderHeapSnapshotTable(toHeapSnapshotReport(browser.base), toHeapSnapshotReport(browser.head));
	const lines = [
		'## 🖥 Frontend Diagnostics Report',
		'',
		renderBrowserSummaryTable(browser.base, browser.head),
		'',
		`_Values are median ± MAD (${browser.base.samples.length} base / ${browser.head.samples.length} head samples). Δ is Head - Base. Only changes outside observed noise that reach the display threshold are shown._`,
		'',
		detailedHtmlUrl == null || detailedHtmlUrl === '' ? null : `[View details](${detailedHtmlUrl})`,
		detailedHtmlUrl == null || detailedHtmlUrl === '' ? null : '',
		'<details>',
		'<summary>Requests by resource type</summary>',
		'',
		renderResourceTypeTable(browser.base, browser.head),
		'',
		'</details>',
		'',
		'<details>',
		'<summary>V8 heap snapshot statistics</summary>',
		'',
		heapSnapshotTable ?? '_No V8 heap snapshot data._',
		'',
		//renderHeapSnapshotSankey(toHeapSnapshotReport(browser.head), 'Head'),
		//'',
		`Download representative heap snapshot: [base](${browser.baseHeapSnapshotUrl}) / [head](${browser.headHeapSnapshotUrl})`,
		'</details>',
		'',
		'## 📦 Bundle Stats',
		'',
		renderFrontendChunkReport(bundle.base, bundle.head),
		'',
		renderVisualizerSummaryTable(collectVisualizerReport(bundle.baseStats), collectVisualizerReport(bundle.headStats)),
		'',
		`[Open treemap HTML](${bundle.visualizerArtifactUrl})`,
		'',
	];

	return lines.filter(line => line != null).join('\n').trimEnd() + '\n';
}
