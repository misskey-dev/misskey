/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { formatBytes, formatColoredDelta, formatNumber } from 'diagnostics-shared/format';
import { pairedDeltaSummary, sampleSpread } from 'diagnostics-shared/stats';
import { renderHeapSnapshotTable, type HeapSnapshotReport } from 'diagnostics-shared/heap-snapshot';
import type { BrowserMeasurement, BrowserMeasurementSample, BrowserMetricsReport } from '../types';

export type RenderMarkdownOptions = {
	baseHeapSnapshotUrl: string;
	headHeapSnapshotUrl: string;
	detailedHtmlUrl?: string | null;
};

function renderMetricRow(
	label: string,
	base: BrowserMetricsReport,
	head: BrowserMetricsReport,
	getSummaryValue: (summary: BrowserMeasurement) => number,
	getSampleValue: (sample: BrowserMeasurementSample) => number,
	formatter: (value: number) => string,
	significantThreshold = 0,
	skipIfNotSignificant = true,
) {
	const baseValue = getSummaryValue(base.summary);
	const headValue = getSummaryValue(head.summary);
	if (baseValue == null || headValue == null || !Number.isFinite(baseValue) || !Number.isFinite(headValue)) return null;

	const summary = pairedDeltaSummary(base.samples, head.samples, sample => getSampleValue(sample));
	// 有意な閾値に満たない場合はそもそもrowとして出力しない
	if (skipIfNotSignificant && (Math.abs(summary.median) < significantThreshold)) return null;

	const deltaMedian = formatColoredDelta(summary.median, formatter, significantThreshold);

	return `| **${label}** | ${formatter(baseValue)} | ${formatter(headValue)} | ${deltaMedian} | ${formatter(summary.mad)} | ${formatColoredDelta(summary.min, formatter, significantThreshold)} | ${formatColoredDelta(summary.max, formatter, significantThreshold)} |`;
}

function resourceTypeBytes(report: BrowserMeasurement, resourceTypes: string[]) {
	return resourceTypes.reduce((sum, resourceType) => sum + (report.network.byResourceType[resourceType]?.encodedBytes ?? 0), 0);
}

function resourceTypeSampleBytes(sample: BrowserMeasurementSample, resourceTypes: string[]) {
	return resourceTypeBytes(sample, resourceTypes);
}

function renderSummaryTable(base: BrowserMetricsReport, head: BrowserMetricsReport, all = false) {
	//function getMetric(report: BrowserMeasurement, key: string) {
	//	return report.performance.cdpMetrics[key];
	//}

	const rows = [
		//renderMetricRow('Scenario duration', base, head, summary => summary.durationMs, sample => sample.durationMs, formatMs),
		renderMetricRow('Requests', base, head, summary => summary.network.requestCount, sample => sample.network.requestCount, formatNumber, 1, !all),
		//renderMetricRow('Failed requests', base, head, summary => summary.network.failedRequestCount, sample => sample.network.failedRequestCount, formatNumber),
		renderMetricRow('Encoded network', base, head, summary => summary.network.totalEncodedBytes, sample => sample.network.totalEncodedBytes, formatBytes, 10000, !all),
		renderMetricRow('Decoded body', base, head, summary => summary.network.totalDecodedBodyBytes, sample => sample.network.totalDecodedBodyBytes, formatBytes, 10000, !all),
		renderMetricRow('Same-origin encoded', base, head, summary => summary.network.sameOriginEncodedBytes, sample => sample.network.sameOriginEncodedBytes, formatBytes, 10000, !all),
		renderMetricRow('Third-party encoded', base, head, summary => summary.network.thirdPartyEncodedBytes, sample => sample.network.thirdPartyEncodedBytes, formatBytes, 10000, !all),
		renderMetricRow('Script encoded', base, head, summary => resourceTypeBytes(summary, ['Script']), sample => resourceTypeSampleBytes(sample, ['Script']), formatBytes, 10000, !all),
		renderMetricRow('Stylesheet encoded', base, head, summary => resourceTypeBytes(summary, ['Stylesheet']), sample => resourceTypeSampleBytes(sample, ['Stylesheet']), formatBytes, 10000, !all),
		renderMetricRow('Fetch/XHR encoded', base, head, summary => resourceTypeBytes(summary, ['Fetch', 'XHR']), sample => resourceTypeSampleBytes(sample, ['Fetch', 'XHR']), formatBytes, 10000, !all),
		renderMetricRow('Image encoded', base, head, summary => resourceTypeBytes(summary, ['Image']), sample => resourceTypeSampleBytes(sample, ['Image']), formatBytes, 10000, !all),
		renderMetricRow('Font encoded', base, head, summary => resourceTypeBytes(summary, ['Font']), sample => resourceTypeSampleBytes(sample, ['Font']), formatBytes, 10000, !all),
		//renderMetricRow('First contentful paint', base, head, summary => summary.performance.webVitals.firstContentfulPaintMs, sample => sample.performance.webVitals.firstContentfulPaintMs, formatMs),
		//renderMetricRow('Load event end', base, head, summary => summary.performance.webVitals.loadEventEndMs, sample => sample.performance.webVitals.loadEventEndMs, formatMs),
		//renderMetricRow('Long tasks', base, head, summary => summary.performance.webVitals.longTaskCount, sample => sample.performance.webVitals.longTaskCount, formatNumber),
		//renderMetricRow('Long task duration', base, head, summary => summary.performance.webVitals.longTaskDurationMs, sample => sample.performance.webVitals.longTaskDurationMs, formatMs),
		//renderMetricRow('Max long task', base, head, summary => summary.performance.webVitals.maxLongTaskDurationMs, sample => sample.performance.webVitals.maxLongTaskDurationMs, formatMs),
		//renderMetricRow('JS heap used', base, head, summary => summary.performance.runtimeHeap?.usedSize ?? getMetric(summary, 'JSHeapUsedSize'), sample => sample.performance.runtimeHeap?.usedSize ?? getMetric(sample, 'JSHeapUsedSize'), formatBytes),
		//renderMetricRow('JS heap total', base, head, summary => summary.performance.runtimeHeap?.totalSize ?? getMetric(summary, 'JSHeapTotalSize'), sample => sample.performance.runtimeHeap?.totalSize ?? getMetric(sample, 'JSHeapTotalSize'), formatBytes),
		//renderMetricRow('V8 heap snapshot total', base, head, summary => summary.heapSnapshot.categories.total, sample => sample.heapSnapshot.categories.total, formatBytes, 10000),
		//renderMetricRow('DOM elements', base, head, summary => summary.performance.webVitals.domElements, sample => sample.performance.webVitals.domElements, formatNumber),
		//renderMetricRow('CDP nodes', base, head, summary => getMetric(summary, 'Nodes'), sample => getMetric(sample, 'Nodes'), formatNumber),
		//renderMetricRow('JS event listeners', base, head, summary => getMetric(summary, 'JSEventListeners'), sample => getMetric(sample, 'JSEventListeners'), formatNumber),
		//renderMetricRow('Layout count', base, head, summary => getMetric(summary, 'LayoutCount'), sample => getMetric(sample, 'LayoutCount'), formatNumber),
		//renderMetricRow('Recalc style count', base, head, summary => getMetric(summary, 'RecalcStyleCount'), sample => getMetric(sample, 'RecalcStyleCount'), formatNumber),
		//renderMetricRow('Script duration', base, head, summary => getMetric(summary, 'ScriptDuration'), sample => getMetric(sample, 'ScriptDuration'), formatSecondsAsMs),
		//renderMetricRow('Task duration', base, head, summary => getMetric(summary, 'TaskDuration'), sample => getMetric(sample, 'TaskDuration'), formatSecondsAsMs),
		renderMetricRow('WebSocket connections', base, head, summary => summary.network.webSocketConnectionCount, sample => sample.network.webSocketConnectionCount, formatNumber, 1, !all),
		renderMetricRow('WebSocket sent', base, head, summary => summary.network.webSocketSentBytes, sample => sample.network.webSocketSentBytes, formatBytes, 10000, !all),
		renderMetricRow('WebSocket received', base, head, summary => summary.network.webSocketReceivedBytes, sample => sample.network.webSocketReceivedBytes, formatBytes, 10000, !all),
		renderMetricRow('Page errors', base, head, summary => summary.diagnostics.pageErrorCount, sample => sample.diagnostics.pageErrorCount, formatNumber, 1, !all),
		renderMetricRow('Console log', base, head, summary => summary.diagnostics.console.log, sample => sample.diagnostics.console.log, formatNumber, 1, !all),
		renderMetricRow('Console warnings', base, head, summary => summary.diagnostics.console.warning, sample => sample.diagnostics.console.warning, formatNumber, 1, !all),
		renderMetricRow('Console errors', base, head, summary => summary.diagnostics.console.error, sample => sample.diagnostics.console.error, formatNumber, 1, !all),
		renderMetricRow('Console info', base, head, summary => summary.diagnostics.console.info, sample => sample.diagnostics.console.info, formatNumber, 1, !all),
		renderMetricRow('Page-attributed memory', base, head, summary => summary.performance.tabMemory.totalBytes, sample => sample.performance.tabMemory.totalBytes, formatBytes, 10000, !all),
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

export function renderMarkdown(base: BrowserMetricsReport, head: BrowserMetricsReport, options: RenderMarkdownOptions) {
	const detailedHtmlUrl = options.detailedHtmlUrl;
	const heapSnapshotTable = renderHeapSnapshotTable(toHeapSnapshotReport(base), toHeapSnapshotReport(head));
	const lines = [
		'## 🖥 Frontend Browser Diagnostics Report',
		'',
		renderSummaryTable(base, head),
		'',
		'<i>Only metrics showing significant changes are displayed.</i>',
		'',
		detailedHtmlUrl == null || detailedHtmlUrl === '' ? null : `[View details](${detailedHtmlUrl})`,
		detailedHtmlUrl == null || detailedHtmlUrl === '' ? null : '',
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
		//renderHeapSnapshotSankey(toHeapSnapshotReport(head), 'Head'),
		//'',
		`Download representative heap snapshot: [base](${options.baseHeapSnapshotUrl}) / [head](${options.headHeapSnapshotUrl})`,
		'</details>',
		'',
	];

	return lines.filter(line => line != null).join('\n').trimEnd() + '\n';
}
