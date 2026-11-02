/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { formatBytes, formatColoredDelta, formatNumber } from 'diagnostics-shared/format';
import { renderHeapSnapshotTable, type HeapSnapshotReport } from 'diagnostics-shared/heap-snapshot';
import { renderMetricComparisonTable } from 'diagnostics-shared/metric-table';
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

function resourceTypeSampleBytes(sample: BrowserMeasurementSample, resourceTypes: string[]) {
	return resourceTypes.reduce((sum, resourceType) => sum + (sample.network.byResourceType[resourceType]?.encodedBytes ?? 0), 0);
}

function renderBrowserSummaryTable(base: BrowserMetricsReport, head: BrowserMetricsReport) {
	return renderMetricComparisonTable(
		base.samples,
		head.samples,
		[{
			label: '**Requests**',
			getValue: sample => sample.network.requestCount,
			formatValue: formatNumber,
			absoluteThreshold: 1,
		}, {
			label: '**Encoded network**',
			getValue: sample => sample.network.totalEncodedBytes,
			formatValue: formatBytes,
			absoluteThreshold: 10_000,
		}, {
			label: '**Decoded body**',
			getValue: sample => sample.network.totalDecodedBodyBytes,
			formatValue: formatBytes,
			absoluteThreshold: 10_000,
		}, {
			label: '**Same-origin encoded**',
			getValue: sample => sample.network.sameOriginEncodedBytes,
			formatValue: formatBytes,
			absoluteThreshold: 10_000,
		}, {
			label: '**Third-party encoded**',
			getValue: sample => sample.network.thirdPartyEncodedBytes,
			formatValue: formatBytes,
			absoluteThreshold: 10_000,
		}, {
			label: '**Script encoded**',
			getValue: sample => resourceTypeSampleBytes(sample, ['Script']),
			formatValue: formatBytes,
			absoluteThreshold: 10_000,
		}, {
			label: '**Stylesheet encoded**',
			getValue: sample => resourceTypeSampleBytes(sample, ['Stylesheet']),
			formatValue: formatBytes,
			absoluteThreshold: 10_000,
		}, {
			label: '**Fetch/XHR encoded**',
			getValue: sample => resourceTypeSampleBytes(sample, ['Fetch', 'XHR']),
			formatValue: formatBytes,
			absoluteThreshold: 10_000,
		}, {
			label: '**Image encoded**',
			getValue: sample => resourceTypeSampleBytes(sample, ['Image']),
			formatValue: formatBytes,
			absoluteThreshold: 10_000,
		}, {
			label: '**Font encoded**',
			getValue: sample => resourceTypeSampleBytes(sample, ['Font']),
			formatValue: formatBytes,
			absoluteThreshold: 10_000,
		}, {
			label: '**WebSocket connections**',
			getValue: sample => sample.network.webSocketConnectionCount,
			formatValue: formatNumber,
			absoluteThreshold: 1,
		}, {
			label: '**WebSocket sent**',
			getValue: sample => sample.network.webSocketSentBytes,
			formatValue: formatBytes,
			absoluteThreshold: 10_000,
		}, {
			label: '**WebSocket received**',
			getValue: sample => sample.network.webSocketReceivedBytes,
			formatValue: formatBytes,
			absoluteThreshold: 10_000,
		}, {
			label: '**Page errors**',
			getValue: sample => sample.diagnostics.pageErrorCount,
			formatValue: formatNumber,
			absoluteThreshold: 1,
		}, {
			label: '**Console log**',
			getValue: sample => sample.diagnostics.console.log,
			formatValue: formatNumber,
			absoluteThreshold: 1,
		}, {
			label: '**Console warnings**',
			getValue: sample => sample.diagnostics.console.warning,
			formatValue: formatNumber,
			absoluteThreshold: 1,
		}, {
			label: '**Console errors**',
			getValue: sample => sample.diagnostics.console.error,
			formatValue: formatNumber,
			absoluteThreshold: 1,
		}, {
			label: '**Console info**',
			getValue: sample => sample.diagnostics.console.info,
			formatValue: formatNumber,
			absoluteThreshold: 1,
		}, {
			label: '**Page-attributed memory**',
			getValue: sample => sample.performance.tabMemory.totalBytes,
			formatValue: formatBytes,
			absoluteThreshold: 10_000,
		}],
		{ onlySignificantChanges: true },
	);
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
