/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { readFile, writeFile } from 'node:fs/promises';
import * as util from './utility.mts';
import * as heapSnapshotUtil from './heap-snapshot-util.mts';
import type { MemoryReport } from './backend-diagnostics.inspect.mts';

const [baseFile, headFile, outputFile] = process.argv.slice(2);

const memoryReportPhases = [
	{
		key: 'afterGc',
		title: 'After GC',
	},
] as const;

const memoryMetrics = [
	'HeapUsed',
	'Pss',
	'USS',
	'External',
] as const;

function formatMemoryMb(valueKiB: number | null | undefined) {
	if (valueKiB == null) return '-';
	return `${util.formatNumber(valueKiB / 1000)} MB`;
}

function formatMemoryMetricName(metric: typeof memoryMetrics[number]) {
	return metric === 'Pss' ? 'PSS' : metric;
}

function getMemoryValueFromSample(sample: MemoryReport['samples'][number], phase: typeof memoryReportPhases[number]['key'], metric: typeof memoryMetrics[number]) {
	const memoryUsage = sample.phases[phase].memoryUsage;
	if (metric !== 'USS') return memoryUsage[metric];
	return memoryUsage.Private_Clean + memoryUsage.Private_Dirty;
}

function getSampleValues(report: MemoryReport, phase: typeof memoryReportPhases[number]['key'], metric: typeof memoryMetrics[number]) {
	return report.samples.map(sample => getMemoryValueFromSample(sample, phase, metric));
}

function getMemoryValue(report: MemoryReport, phase: typeof memoryReportPhases[number]['key'], metric: typeof memoryMetrics[number]) {
	if (metric !== 'USS') return report.summary[phase].memoryUsage[metric];
	return util.median(getSampleValues(report, phase, metric));
}

function getSampleSpread(report: MemoryReport, phase: typeof memoryReportPhases[number]['key'], metric: typeof memoryMetrics[number]) {
	const values = getSampleValues(report, phase, metric);
	if (values.length < 2) return null;

	const center = util.median(values);
	return util.median(values.map(value => Math.abs(value - center)));
}

function renderMainTableForPhase(base: MemoryReport, head: MemoryReport, phase: typeof memoryReportPhases[number]['key']) {
	const lines = [
		'| Metric | Base | Head | Δ median | Δ MAD | Δ min | Δ max |',
		'| --- | ---: | ---: | ---: | ---: | ---: | ---: |',
	];

	function formatDeltaMemory(deltaKiB: number) {
		return util.formatColoredDelta(deltaKiB, v => formatMemoryMb(v), 100); // 0.1 MB threshold
	}

	for (const metric of memoryMetrics) {
		const baseValue = getMemoryValue(base, phase, metric);
		const headValue = getMemoryValue(head, phase, metric);

		const baseSpread = getSampleSpread(base, phase, metric);
		const headSpread = getSampleSpread(head, phase, metric);
		const summary = util.pairedDeltaSummary(base.samples, head.samples, (sample) => getMemoryValueFromSample(sample, phase, metric));
		const percent = summary.median * 100 / baseValue;
		const deltaMedian = `${formatDeltaMemory(summary.median)}<br>${util.formatDeltaPercent(percent, 0.1).replaceAll('\\%', '\\\\%')}`;

		lines.push(`| **${formatMemoryMetricName(metric)}** | ${formatMemoryMb(baseValue)} <br> ± ${formatMemoryMb(baseSpread)} | ${formatMemoryMb(headValue)} <br> ± ${formatMemoryMb(headSpread)} | ${deltaMedian} | ${formatMemoryMb(summary.mad)} | ${formatDeltaMemory(summary.min)} | ${formatDeltaMemory(summary.max)} |`);
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

	const table = heapSnapshotUtil.renderHeapSnapshotTable(baseHeapSnapshotReport, headHeapSnapshotReport);
	if (table == null) return null;

	const lines = [
		'### V8 Heap Snapshot Statistics',
		'',
		table,
		'',
	];

	for (const graph of [
		//heapSnapshotUtil.renderHeapSnapshotSankey(baseHeapSnapshotReport, 'Base'),
		//heapSnapshotUtil.renderHeapSnapshotSankey(headHeapSnapshotReport, 'Head'),
	]) {
		if (graph == null) continue;
		lines.push(graph);
		lines.push('');
	}

	return lines.join('\n');
}

const base = JSON.parse(await readFile(baseFile, 'utf8')) as MemoryReport;
const head = JSON.parse(await readFile(headFile, 'utf8')) as MemoryReport;

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

const baseHeapSnapshotArtifactUrl = process.env.MK_MEMORY_HEAP_SNAPSHOT_ARTIFACT_URL_BASE!.trim();
const headHeapSnapshotArtifactUrl = process.env.MK_MEMORY_HEAP_SNAPSHOT_ARTIFACT_URL_HEAD!.trim();
lines.push(`Download representative heap snapshot: [base](${baseHeapSnapshotArtifactUrl}) / [head](${headHeapSnapshotArtifactUrl})`);
lines.push('');

function getDiffPercent(base: MemoryReport, head: MemoryReport, phase: typeof memoryReportPhases[number]['key'], metric: typeof memoryMetrics[number]) {
	const baseValue = getMemoryValue(base, phase, metric);
	const headValue = getMemoryValue(head, phase, metric);
	return ((headValue - baseValue) * 100) / baseValue;
}

function isBeyondSampleNoise(base: MemoryReport, head: MemoryReport, phase: typeof memoryReportPhases[number]['key'], metric: typeof memoryMetrics[number]) {
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

const warningMetric = 'Pss';
const warningDiffPercent = getDiffPercent(base, head, 'afterGc', warningMetric);
if (warningDiffPercent > 5 && isBeyondSampleNoise(base, head, 'afterGc', warningMetric)) {
	lines.push(`⚠️ **Warning**: Memory usage (${formatMemoryMetricName(warningMetric)}) has increased by more than 5% and exceeds the observed sample noise. Please verify this is not an unintended change.`);
	lines.push('');
}

await writeFile(outputFile, `${lines.join('\n')}\n`);
