/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { formatKiBAsMb } from 'diagnostics-shared/format';
import { renderHeapSnapshotTable, type HeapSnapshotReport } from 'diagnostics-shared/heap-snapshot';
import { renderMetricComparisonTable } from 'diagnostics-shared/metric-table';
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

const memoryMetrics = [
	'HeapUsed',
	'Pss',
	'USS',
	'External',
] as const;

type MemoryMetric = typeof memoryMetrics[number];

const memoryColorThresholdKiB = 100;

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
		memoryMetrics.map(metric => ({
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

	for (const phase of memoryReportPhases) {
		lines.push(`### Memory: ${phase.title}`);
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
