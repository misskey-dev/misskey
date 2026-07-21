/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { formatColoredDelta, formatDeltaPercentInMdTable, formatKiBAsMb } from 'diagnostics-shared/format';
import { independentDeltaSummary, type IndependentDeltaSummary, type IndependentDeltaVerdict } from 'diagnostics-shared/stats';
import { renderHeapSnapshotTable, type HeapSnapshotReport } from 'diagnostics-shared/heap-snapshot';
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
const percentColorThreshold = 0.1;

function formatMemoryMetricName(metric: MemoryMetric) {
	return metric === 'Pss' ? 'PSS' : metric;
}

function getMemoryValueFromSample(sample: MemoryReport['samples'][number], phase: MemoryPhase, metric: MemoryMetric) {
	const memoryUsage = sample.phases[phase].memoryUsage;
	// USSは直接取れないのでPrivateの合算で近似する
	if (metric !== 'USS') return memoryUsage[metric];
	return memoryUsage.Private_Clean + memoryUsage.Private_Dirty;
}

function hasNonConvergedMemorySample(base: MemoryReport, head: MemoryReport, phase: MemoryPhase) {
	return [...base.samples, ...head.samples]
		.some(sample => !sample.phases[phase].memoryStability.converged);
}

function summarizeMemoryMetric(base: MemoryReport, head: MemoryReport, phase: MemoryPhase, metric: MemoryMetric) {
	return independentDeltaSummary(
		base.samples,
		head.samples,
		sample => getMemoryValueFromSample(sample, phase, metric),
		{ forceInconclusive: hasNonConvergedMemorySample(base, head, phase) },
	);
}

function isDirectionalVerdict(verdict: IndependentDeltaVerdict) {
	return verdict === 'increase' || verdict === 'decrease';
}

function formatMedianWithMad(value: number | null, spread: number | null) {
	if (value == null) return '-';
	return `${formatKiBAsMb(value)} <br> ± ${formatKiBAsMb(spread)}`;
}

function formatMemoryDelta(summary: IndependentDeltaSummary) {
	if (summary.delta == null) return '-';
	return formatColoredDelta(
		summary.delta,
		value => formatKiBAsMb(value),
		isDirectionalVerdict(summary.verdict) ? memoryColorThresholdKiB : Number.POSITIVE_INFINITY,
	);
}

function getDeltaPercent(summary: IndependentDeltaSummary) {
	if (summary.baseMedian == null || summary.baseMedian === 0 || summary.delta == null) return null;
	return summary.delta * 100 / summary.baseMedian;
}

function formatMemoryDeltaPercent(summary: IndependentDeltaSummary) {
	const percent = getDeltaPercent(summary);
	if (percent == null) return '-';
	return formatDeltaPercentInMdTable(
		percent,
		isDirectionalVerdict(summary.verdict) ? percentColorThreshold : Number.POSITIVE_INFINITY,
	);
}

function renderMainTableForPhase(base: MemoryReport, head: MemoryReport, phase: MemoryPhase) {
	const lines = [
		'| Metric | @ Base | @ Head | Δ | MAD | Result |',
		'| --- | ---: | ---: | ---: | ---: | --- |',
	];

	for (const metric of memoryMetrics) {
		const summary = summarizeMemoryMetric(base, head, phase, metric);
		const delta = `${formatMemoryDelta(summary)}<br>${formatMemoryDeltaPercent(summary)}`;

		lines.push(`| **${formatMemoryMetricName(metric)}** | ${formatMedianWithMad(summary.baseMedian, summary.baseMad)} | ${formatMedianWithMad(summary.headMedian, summary.headMad)} | ${delta} | ${formatKiBAsMb(summary.combinedMad)} | ${summary.verdict} |`);
	}

	return lines.join('\n');
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

	lines.push(`_Values are median ± MAD (${base.samples.length} base / ${head.samples.length} head samples). Delta is Head - Base. Results are increase or decrease only when |Delta| > 3 × MAD._`);
	lines.push('');

	const nonConvergedSamples = countNonConvergedMemorySamples(base, head);
	if (nonConvergedSamples > 0) {
		const noun = nonConvergedSamples === 1 ? 'sample' : 'samples';
		lines.push(`⚠️ **Measurement warning**: ${nonConvergedSamples} memory ${noun} did not converge. Memory results are marked inconclusive.`);
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
	if (warningSummary.verdict === 'increase' && warningDiffPercent != null && warningDiffPercent > 5) {
		lines.push(`⚠️ **Warning**: Memory usage (${formatMemoryMetricName(warningMetric)}) has increased by more than 5% and exceeds the observed sample noise. Please verify this is not an unintended change.`);
		lines.push('');
	}

	return `${lines.join('\n')}\n`;
}
