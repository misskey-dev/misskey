/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { formatBytes, formatKiBAsMb } from 'diagnostics-shared/format';
import { renderHeapSnapshotTable, type HeapSnapshotReport } from 'diagnostics-shared/heap-snapshot';
import {
	metricComparisonTableHeader,
	renderMetricComparisonRow,
	renderMetricComparisonTable,
} from 'diagnostics-shared/metric-table';
import {
	independentDeltaSummary,
	isOutsideObservedNoise,
	type IndependentDeltaSummary,
} from 'diagnostics-shared/stats';
import type { MemoryPhase, MemoryReport } from '../types';

export type RenderMemoryReportOptions = {
	baseHeapSnapshotUrl: string;
	headHeapSnapshotUrl: string;
};

const memoryReportPhases = [
	{
		key: 'afterGc',
		title: 'After GC',
	},
] as const satisfies readonly { key: MemoryPhase; title: string }[];

/** 内訳として、有意な変化があったときだけ表示する指標 (USSはサマリーに常に表示する) */
const memoryBreakdownMetrics = [
	'HeapUsed',
	'Pss',
	'External',
] as const;

type MemoryMetric = typeof memoryBreakdownMetrics[number] | 'USS';

const memoryColorThresholdKiB = 100;

/** これ未満のバイト差分には色を付けない (0.1 MB)。V8 Heap Snapshot Statisticsの表と揃える */
const heapSnapshotColorThresholdBytes = 100_000;

const howToReadDetails = [
	'<details>',
	'<summary>How to read this report</summary>',
	'',
	'- **Process memory (USS)**: Memory that belongs only to this process (its private pages), as seen by the OS. This is what would be freed if the process exited, and it includes everything (JS heap, native allocations, code). It is noisy, so small changes often stay within the noise.',
	'- **JS heap (snapshot total)**: Total size of the objects reachable from JavaScript, taken from a V8 heap snapshot after GC. Strings stored outside the V8 heap are counted at their real size. It has little noise, so it is the best signal for small changes. It does not include native memory that is not held by JS objects.',
	'- **HeapUsed / External** (`process.memoryUsage()`): Breakdown only; do not judge a change by them alone. The same data can move between the two. For example, Node.js keeps a module source longer than about 1 M characters outside the V8 heap, and `External` can report only about half of its real size. A change that makes a bundle chunk cross that size can raise HeapUsed and lower External even when total memory went down.',
	'- **PSS**: Like USS, plus a proportional share of the memory shared with other processes (e.g. shared libraries).',
	'</details>',
].join('\n');

function formatMemoryMetricName(metric: MemoryMetric) {
	return metric === 'Pss' ? 'PSS' : metric;
}

function getMemoryValueFromSample(sample: MemoryReport['samples'][number], phase: MemoryPhase, metric: MemoryMetric) {
	const memoryUsage = sample.phases[phase].memoryUsage;
	// USSは直接取れないのでPrivateの合算で近似する
	if (metric !== 'USS') return memoryUsage[metric];
	return memoryUsage.Private_Clean + memoryUsage.Private_Dirty;
}

function summarizeMemoryMetric(base: MemoryReport, head: MemoryReport, phase: MemoryPhase, metric: MemoryMetric) {
	return independentDeltaSummary(
		base.samples,
		head.samples,
		sample => getMemoryValueFromSample(sample, phase, metric),
	);
}

function getDeltaPercent(summary: IndependentDeltaSummary) {
	if (summary.baseMedian === 0) return null;
	return summary.delta * 100 / summary.baseMedian;
}

function renderMainTableForPhase(base: MemoryReport, head: MemoryReport, phase: MemoryPhase) {
	return renderMetricComparisonTable(
		base.samples,
		head.samples,
		memoryBreakdownMetrics.map(metric => ({
			label: `**${formatMemoryMetricName(metric)}**`,
			getValue: sample => getMemoryValueFromSample(sample, phase, metric),
			formatValue: formatKiBAsMb,
			absoluteThreshold: memoryColorThresholdKiB,
		})),
		{ onlySignificantChanges: true },
	);
}

function toHeapSnapshotReport(report: MemoryReport): HeapSnapshotReport | null {
	const summary = report.summary.afterGc.heapSnapshot;
	if (summary == null) return null;

	return {
		summary,
		samples: report.samples.flatMap(sample => {
			const data = sample.phases.afterGc.heapSnapshot;
			return data == null ? [] : [{ round: sample.round, data }];
		}),
	};
}

/**
 * 実際のメモリ使用量が増えたか減ったかを判断するための指標を、有意かどうかにかかわらず常に表示する。
 */
function renderSummarySection(base: MemoryReport, head: MemoryReport) {
	const rows = [
		renderMetricComparisonRow(base.samples, head.samples, {
			label: '**Process memory (USS)**',
			getValue: sample => getMemoryValueFromSample(sample, 'afterGc', 'USS'),
			formatValue: formatKiBAsMb,
			absoluteThreshold: memoryColorThresholdKiB,
		}).line,
	];

	const baseHeapSnapshotReport = toHeapSnapshotReport(base);
	const headHeapSnapshotReport = toHeapSnapshotReport(head);
	if (baseHeapSnapshotReport != null && headHeapSnapshotReport != null) {
		rows.push(renderMetricComparisonRow(baseHeapSnapshotReport.samples, headHeapSnapshotReport.samples, {
			label: '**JS heap (snapshot total)**',
			getValue: sample => sample.data.categories.total,
			formatValue: formatBytes,
			absoluteThreshold: heapSnapshotColorThresholdBytes,
		}).line);
	}

	return [
		'### Summary',
		'',
		...metricComparisonTableHeader,
		...rows,
		'',
		'Use these rows to judge whether memory usage actually changed. Uncolored deltas are within the measurement noise.',
		'',
		howToReadDetails,
	].join('\n');
}

function renderHeapSnapshotSection(base: MemoryReport, head: MemoryReport) {
	const baseHeapSnapshotReport = toHeapSnapshotReport(base);
	const headHeapSnapshotReport = toHeapSnapshotReport(head);
	if (baseHeapSnapshotReport == null || headHeapSnapshotReport == null) return null;

	const table = renderHeapSnapshotTable(baseHeapSnapshotReport, headHeapSnapshotReport);

	const lines = [
		'### V8 Heap Snapshot Statistics',
		'',
		table,
		'',
	];

	// Sankeyはノイズが多く読み取りづらかったため現在は無効。復活させる余地を残して残置する
	for (const graph of [
		//renderHeapSnapshotSankey(baseHeapSnapshotReport, 'Base'),
		//renderHeapSnapshotSankey(headHeapSnapshotReport, 'Head'),
	] as (string | null)[]) {
		if (graph == null) continue;
		lines.push(graph);
		lines.push('');
	}

	return lines.join('\n');
}

function countNonConvergedMemorySamples(base: MemoryReport, head: MemoryReport) {
	return [base, head]
		.flatMap(report => report.samples)
		.filter(sample => memoryReportPhases.some(phase => !sample.phases[phase.key].memoryStability.converged))
		.length;
}

export function renderMemoryReportMarkdown(base: MemoryReport, head: MemoryReport, options: RenderMemoryReportOptions) {
	const lines = [
		'## ⚙️ Backend Diagnostics Report',
		'',
	];

	//const summary = measurementSummary(base, head);
	//if (summary != null) {
	//	lines.push(summary);
	//	lines.push('');
	//}

	lines.push(renderSummarySection(base, head));
	lines.push('');

	for (const phase of memoryReportPhases) {
		lines.push(`### Memory breakdown: ${phase.title}`);
		lines.push(renderMainTableForPhase(base, head, phase.key));
		lines.push('');
	}

	lines.push('');

	const nonConvergedSamples = countNonConvergedMemorySamples(base, head);
	if (nonConvergedSamples > 0) {
		const noun = nonConvergedSamples === 1 ? 'sample' : 'samples';
		lines.push(`⚠️ **Measurement warning**: ${nonConvergedSamples} memory ${noun} did not converge.`);
		lines.push('');
	}

	const heapSnapshotSection = renderHeapSnapshotSection(base, head);
	if (heapSnapshotSection != null) {
		lines.push(heapSnapshotSection);
		lines.push('');
	}

	lines.push(`Download representative heap snapshot: [base](${options.baseHeapSnapshotUrl}) / [head](${options.headHeapSnapshotUrl})`);
	lines.push('');

	const warningMetric = 'Pss';
	const warningSummary = summarizeMemoryMetric(base, head, 'afterGc', warningMetric);
	const warningDiffPercent = getDeltaPercent(warningSummary);
	if (
		warningSummary.delta > 0 &&
		warningDiffPercent != null &&
		warningDiffPercent > 5 &&
		isOutsideObservedNoise(warningSummary)
	) {
		lines.push(`⚠️ **Warning**: Memory usage (${formatMemoryMetricName(warningMetric)}) has increased by more than 5% and exceeds the observed sample noise. Please verify this is not an unintended change.`);
		lines.push('');
	}

	return `${lines.join('\n')}\n`;
}
