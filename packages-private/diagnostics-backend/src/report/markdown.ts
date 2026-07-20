/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { formatColoredDelta, formatDeltaPercentInMdTable, formatKiBAsMb } from 'diagnostics-shared/format';
import { median, pairedDeltaSummary, sampleSpread } from 'diagnostics-shared/stats';
import { renderHeapSnapshotTable } from 'diagnostics-shared/heap-snapshot';
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

function formatMemoryMetricName(metric: MemoryMetric) {
	return metric === 'Pss' ? 'PSS' : metric;
}

function getMemoryValueFromSample(sample: MemoryReport['samples'][number], phase: MemoryPhase, metric: MemoryMetric) {
	const memoryUsage = sample.phases[phase].memoryUsage;
	// USSは直接取れないのでPrivateの合算で近似する
	if (metric !== 'USS') return memoryUsage[metric];
	return memoryUsage.Private_Clean + memoryUsage.Private_Dirty;
}

function getSampleValues(report: MemoryReport, phase: MemoryPhase, metric: MemoryMetric) {
	return report.samples.map(sample => getMemoryValueFromSample(sample, phase, metric));
}

function getMemoryValue(report: MemoryReport, phase: MemoryPhase, metric: MemoryMetric) {
	if (metric !== 'USS') return report.summary[phase].memoryUsage[metric];
	return median(getSampleValues(report, phase, metric));
}

function getSampleSpread(report: MemoryReport, phase: MemoryPhase, metric: MemoryMetric) {
	return sampleSpread(getSampleValues(report, phase, metric));
}

function renderMainTableForPhase(base: MemoryReport, head: MemoryReport, phase: MemoryPhase) {
	const lines = [
		'| Metric | Base | Head | Δ median | Δ MAD | Δ min | Δ max |',
		'| --- | ---: | ---: | ---: | ---: | ---: | ---: |',
	];

	function formatDeltaMemory(deltaKiB: number) {
		return formatColoredDelta(deltaKiB, v => formatKiBAsMb(v), 100); // 0.1 MB threshold
	}

	for (const metric of memoryMetrics) {
		const baseValue = getMemoryValue(base, phase, metric);
		const headValue = getMemoryValue(head, phase, metric);

		const baseSpread = getSampleSpread(base, phase, metric);
		const headSpread = getSampleSpread(head, phase, metric);
		const summary = pairedDeltaSummary(base.samples, head.samples, (sample) => getMemoryValueFromSample(sample, phase, metric));
		const percent = summary.median * 100 / baseValue;
		const deltaMedian = `${formatDeltaMemory(summary.median)}<br>${formatDeltaPercentInMdTable(percent, 0.1)}`;

		lines.push(`| **${formatMemoryMetricName(metric)}** | ${formatKiBAsMb(baseValue)} <br> ± ${formatKiBAsMb(baseSpread)} | ${formatKiBAsMb(headValue)} <br> ± ${formatKiBAsMb(headSpread)} | ${deltaMedian} | ${formatKiBAsMb(summary.mad)} | ${formatDeltaMemory(summary.min)} | ${formatDeltaMemory(summary.max)} |`);
	}

	return lines.join('\n');
}

function renderHeapSnapshotSection(base: MemoryReport, head: MemoryReport) {
	const baseHeapSnapshotReport = {
		summary: base.summary.afterGc.heapSnapshot!,
		samples: base.samples.map(sample => ({
			round: sample.round,
			data: sample.phases.afterGc.heapSnapshot!,
		})),
	};

	const headHeapSnapshotReport = {
		summary: head.summary.afterGc.heapSnapshot!,
		samples: head.samples.map(sample => ({
			round: sample.round,
			data: sample.phases.afterGc.heapSnapshot!,
		})),
	};

	const table = renderHeapSnapshotTable(baseHeapSnapshotReport, headHeapSnapshotReport);
	if (table == null) return null;

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

function getDiffPercent(base: MemoryReport, head: MemoryReport, phase: MemoryPhase, metric: MemoryMetric) {
	const baseValue = getMemoryValue(base, phase, metric);
	const headValue = getMemoryValue(head, phase, metric);
	return ((headValue - baseValue) * 100) / baseValue;
}

/**
 * 増加分がサンプルのばらつきを明確に超えているかを見る。
 * 測定ノイズで警告が出続けるのを避けるため、合成ばらつきの3倍を閾値にする。
 */
function isBeyondSampleNoise(base: MemoryReport, head: MemoryReport, phase: MemoryPhase, metric: MemoryMetric) {
	const baseValue = getMemoryValue(base, phase, metric);
	const headValue = getMemoryValue(head, phase, metric);

	const delta = headValue - baseValue;
	if (delta <= 0) return false;

	const baseSpread = getSampleSpread(base, phase, metric);
	const headSpread = getSampleSpread(head, phase, metric);
	if (baseSpread == null || headSpread == null) return true;

	const combinedSpread = Math.hypot(baseSpread, headSpread);
	return delta > combinedSpread * 3;
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

	const heapSnapshotSection = renderHeapSnapshotSection(base, head);
	if (heapSnapshotSection != null) {
		lines.push(heapSnapshotSection);
		lines.push('');
	}

	lines.push(`Download representative heap snapshot: [base](${options.baseHeapSnapshotUrl}) / [head](${options.headHeapSnapshotUrl})`);
	lines.push('');

	const warningMetric = 'Pss';
	const warningDiffPercent = getDiffPercent(base, head, 'afterGc', warningMetric);
	if (warningDiffPercent > 5 && isBeyondSampleNoise(base, head, 'afterGc', warningMetric)) {
		lines.push(`⚠️ **Warning**: Memory usage (${formatMemoryMetricName(warningMetric)}) has increased by more than 5% and exceeds the observed sample noise. Please verify this is not an unintended change.`);
		lines.push('');
	}

	return `${lines.join('\n')}\n`;
}
