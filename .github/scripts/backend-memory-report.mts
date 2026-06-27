/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { readFile, writeFile } from 'node:fs/promises';
import * as util from './utility.mts';
import * as heapSnapshotUtil from './heap-snapshot-util.mts';
import type { MemoryReport } from './measure-backend-memory-comparison.mts';

const [baseFile, headFile, outputFile, baseJsFootprintFile, headJsFootprintFile] = process.argv.slice(2);

type RuntimeLoadedJsFootprintReport = {
	phases: Record<'afterRequest', {
		totals: {
			loadedJsModules: number;
			loadedJsSourceBytes: number;
			loadedJsGzipBytes: number;
			astNodeCount: number;
			functionCount: number;
			classCount: number;
			stringLiteralBytes: number;
			externalPackageCount: number;
			nativeAddonPackageCount: number;
		};
		modules: {
			path: string;
			package: string;
			category: string;
			sourceBytes: number;
			gzipBytes: number;
			astNodeCount: number;
			functionCount: number;
			classCount: number;
			stringLiteralBytes: number;
		}[];
	}>;
};

const memoryReportPhases = [
	{
		key: 'afterGc',
		title: 'After GC',
	},
] as const;

const metrics = [
	'HeapUsed',
	'Pss',
	'Private_Dirty',
	'VmRSS',
	'External',
] as const;

function formatMemoryMb(valueKiB: number | null | undefined) {
	if (valueKiB == null) return '-';
	return `${util.formatNumber(valueKiB / 1024)} MB`;
}

function getMemoryValue(report: MemoryReport, phase: typeof memoryReportPhases[number]['key'], metric: typeof metrics[number]) {
	return report.summary[phase].memoryUsage[metric];
}

function getMemoryValueFromSample(sample: MemoryReport['samples'][number], phase: typeof memoryReportPhases[number]['key'], metric: typeof metrics[number]) {
	return sample.phases[phase].memoryUsage[metric];
}

function getSampleSpread(report: MemoryReport, phase: typeof memoryReportPhases[number]['key'], metric: typeof metrics[number]) {
	const values = report.samples.map(sample => getMemoryValueFromSample(sample, phase, metric));
	if (values.length < 2) return null;

	const center = util.median(values);
	return util.median(values.map(value => Math.abs(value - center)));
}

function renderMainTableForPhase(base: MemoryReport, head: MemoryReport, phase: typeof memoryReportPhases[number]['key']) {
	const lines = [
		'| Metric | Base | Head | Δ median | Δ MAD | Δ min | Δ max |',
		'| --- | ---: | ---: | ---: | ---: | ---: | ---: |',
	];

	function formatDeltaMemory(diffKiB: number) {
		return util.formatColoredDelta(formatMemoryMb(Math.abs(diffKiB)), diffKiB);
	}

	for (const metric of metrics) {
		const baseValue = getMemoryValue(base, phase, metric);
		const headValue = getMemoryValue(head, phase, metric);

		const baseSpread = getSampleSpread(base, phase, metric);
		const headSpread = getSampleSpread(head, phase, metric);
		const summary = util.pairedDeltaSummary(base.samples, head.samples, (sample) => getMemoryValueFromSample(sample, phase, metric));
		const percent = summary.median * 100 / baseValue;
		const deltaMedian = summary == null ? '-' : `${formatDeltaMemory(summary.median)}<br>${util.formatDeltaPercent(percent).replaceAll('\\%', '\\\\%')}`;

		lines.push(`| **${metric}** | ${formatMemoryMb(baseValue)} <br> ± ${formatMemoryMb(baseSpread)} | ${formatMemoryMb(headValue)} <br> ± ${formatMemoryMb(headSpread)} | ${deltaMedian} | ${summary?.mad == null ? '-' : formatMemoryMb(summary.mad)} | ${summary == null ? '-' : formatDeltaMemory(summary.min)} | ${summary == null ? '-' : formatDeltaMemory(summary.max)} |`);
	}

	return lines.join('\n');
}

/*
function measurementSummary(base, head) {
	const baseCount = base?.sampleCount;
	const headCount = head?.sampleCount;
	const strategy = base?.comparison?.strategy;
	if (baseCount == null || headCount == null) return null;

	if (strategy === 'interleaved-pairs') {
		const rounds = base?.comparison?.rounds ?? baseCount;
		const warmupRounds = base?.comparison?.warmupRounds ?? 0;
		return `_Measured as ${rounds} interleaved base/head pairs after ${warmupRounds} warmup pair(s). Values are medians; ± is median absolute deviation._`;
	}

	return `_Sample count: base ${baseCount}, head ${headCount}. Values are medians; ± is median absolute deviation._`;
}
*/

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
		heapSnapshotUtil.renderHeapSnapshotSankey(headHeapSnapshotReport, 'Head'),
	]) {
		if (graph == null) continue;
		lines.push(graph);
		lines.push('');
	}

	return lines.join('\n');
}

function getJsFootprintValue(report: RuntimeLoadedJsFootprintReport, phase: 'afterRequest', key: keyof RuntimeLoadedJsFootprintReport['phases'][typeof phase]['totals']) {
	const value = report.phases[phase].totals[key];
	return Number.isFinite(value) ? value : null;
}

function renderJsFootprintMetricTable(base: RuntimeLoadedJsFootprintReport, head: RuntimeLoadedJsFootprintReport) {
	const metricRows = [
		['Loaded JS modules', 'loadedJsModules', util.formatNumber],
		['Loaded JS source', 'loadedJsSourceBytes', util.formatBytes],
		//['Loaded JS gzip estimate', 'loadedJsGzipBytes', util.formatBytes],
		//['AST nodes', 'astNodeCount', util.formatNumber],
		//['Functions', 'functionCount', util.formatNumber],
		//['Classes', 'classCount', util.formatNumber],
		//['String literals', 'stringLiteralBytes', util.formatBytes],
		['External packages loaded', 'externalPackageCount', util.formatNumber],
		['Native addon packages', 'nativeAddonPackageCount', util.formatNumber],
	] as const;

	const lines = [
		'| Metric | Base | Head | Δ | Δ (%) |',
		'| --- | ---: | ---: | ---: | ---: |',
	];

	for (const [title, key, formatter] of metricRows) {
		const baseValue = getJsFootprintValue(base, 'afterRequest', key);
		const headValue = getJsFootprintValue(head, 'afterRequest', key);
		if (baseValue == null || headValue == null) continue;

		lines.push(`| **${title}** | ${formatter(baseValue)} | ${formatter(headValue)} | ${util.formatColoredDelta(formatter(headValue - baseValue), headValue - baseValue)} | ${util.calcAndFormatDeltaPercent(baseValue, headValue).replaceAll('\\%', '\\\\%')} |`);
	}

	return lines.join('\n');
}

/*
function renderJsFootprintPhaseTable(base, head) {
	const lines = [
		'| Phase | Base modules | Head modules | Δ modules | Base source | Head source | Δ source |',
		'| --- | ---: | ---: | ---: | ---: | ---: | ---: |',
	];

	for (const [phase, title] of [['startup', 'Startup'], ['afterRequest', 'After warmup requests']]) {
		const baseModules = getJsFootprintValue(base, phase, 'loadedJsModules');
		const headModules = getJsFootprintValue(head, phase, 'loadedJsModules');
		const baseSource = getJsFootprintValue(base, phase, 'loadedJsSourceBytes');
		const headSource = getJsFootprintValue(head, phase, 'loadedJsSourceBytes');
		if (baseModules == null || headModules == null || baseSource == null || headSource == null) continue;

		lines.push(`| ${title} | ${util.formatNumber(baseModules)} | ${util.formatNumber(headModules)} | ${formatPlainDelta(baseModules, headModules)} | ${util.formatBytes(baseSource)} | ${util.formatBytes(headSource)} | ${formatPlainDelta(baseSource, headSource, util.formatBytes)} |`);
	}

	return lines.join('\n');
}
*/

function packageMap(report: RuntimeLoadedJsFootprintReport) {
	const map = new Map();
	for (const packageSummary of report.phases.afterRequest.packages) {
		if (packageSummary?.category !== 'external' || typeof packageSummary.name !== 'string') continue;
		map.set(packageSummary.name, packageSummary);
	}
	return map;
}

function packageDisplayName(packageSummary: { name: string; version?: string | null }) {
	if (packageSummary.version == null) return packageSummary.name;
	return `${packageSummary.name} ${packageSummary.version}`;
}

function renderNewExternalPackages(base: RuntimeLoadedJsFootprintReport, head: RuntimeLoadedJsFootprintReport) {
	const basePackages = packageMap(base);
	const headPackages = packageMap(head);
	const newPackages = [...headPackages.values()]
		.filter(packageSummary => !basePackages.has(packageSummary.name))
		.toSorted((a, b) => b.sourceBytes - a.sourceBytes)
		.slice(0, 10);

	if (newPackages.length === 0) return null;

	const lines = [
		'#### Newly Loaded External Packages',
		'',
		'| Package | Loaded JS | Modules | Notes |',
		'| --- | ---: | ---: | --- |',
	];

	for (const packageSummary of newPackages) {
		lines.push(`| ${packageDisplayName(packageSummary)} | ${util.formatBytes(packageSummary.sourceBytes)} | ${util.formatNumber(packageSummary.modules)} | ${packageSummary.nativeAddon ? 'native addon' : ''} |`);
	}

	return lines.join('\n');
}

function renderLargestPackageIncreases(base: RuntimeLoadedJsFootprintReport, head: RuntimeLoadedJsFootprintReport) {
	const basePackages = packageMap(base);
	const headPackages = packageMap(head);
	const increases = [...headPackages.values()]
		.map(headPackage => {
			const basePackage = basePackages.get(headPackage.name);
			const baseSourceBytes = basePackage?.sourceBytes ?? 0;
			const baseModules = basePackage?.modules ?? 0;
			return {
				...headPackage,
				baseSourceBytes,
				baseModules,
				sourceDiff: headPackage.sourceBytes - baseSourceBytes,
				moduleDiff: headPackage.modules - baseModules,
			};
		})
		.filter(packageSummary => packageSummary.sourceDiff > 0)
		.toSorted((a, b) => b.sourceDiff - a.sourceDiff)
		.slice(0, 10);

	if (increases.length === 0) return null;

	const lines = [
		'#### Largest Package Increases',
		'',
		'| Package | Base | Head | Δ | Modules Δ |',
		'| --- | ---: | ---: | ---: | ---: |',
	];

	for (const packageSummary of increases) {
		lines.push(`| ${packageDisplayName(packageSummary)} | ${util.formatBytes(packageSummary.baseSourceBytes)} | ${util.formatBytes(packageSummary.sourceBytes)} | ${util.formatColoredDelta(util.formatBytes(packageSummary.sourceBytes - packageSummary.baseSourceBytes), packageSummary.sourceBytes - packageSummary.baseSourceBytes)} | ${util.formatColoredDelta(util.formatNumber(packageSummary.modules - packageSummary.baseModules), packageSummary.modules - packageSummary.baseModules)} |`);
	}

	return lines.join('\n');
}

function renderNewLoadedModules(base: RuntimeLoadedJsFootprintReport, head: RuntimeLoadedJsFootprintReport) {
	function moduleMap(report: RuntimeLoadedJsFootprintReport) {
		const map = new Map();
		for (const moduleSummary of report.phases.afterRequest.modules) {
			if (typeof moduleSummary.path !== 'string') continue;
			map.set(moduleSummary.path, moduleSummary);
		}
		return map;
	}

	const baseModules = moduleMap(base);
	const headModules = moduleMap(head);
	const newModules = [...headModules.values()]
		.filter(moduleSummary => !baseModules.has(moduleSummary.path))
		.toSorted((a, b) => b.sourceBytes - a.sourceBytes)
		.slice(0, 10);

	if (newModules.length === 0) return null;

	const lines = [
		'#### Largest Newly Loaded Modules',
		'',
		'| Module | Package | Loaded JS |',
		'| --- | --- | ---: |',
	];

	for (const moduleSummary of newModules) {
		lines.push(`| \`${moduleSummary.path}\` | ${moduleSummary.package} | ${util.formatBytes(moduleSummary.sourceBytes)} |`);
	}

	return lines.join('\n');
}

function renderJsFootprintSection(base: RuntimeLoadedJsFootprintReport, head: RuntimeLoadedJsFootprintReport) {
	const lines = [
		'### Runtime Loaded JS Footprint',
		'',
		'<details><summary>Click to show</summary>',
		'',
		renderJsFootprintMetricTable(base, head),
		'',
		//'#### Load Phase Breakdown',
		//'',
		//renderJsFootprintPhaseTable(base, head),
		//'',
	];

	for (const block of [
		renderNewExternalPackages(base, head),
		renderLargestPackageIncreases(base, head),
		renderNewLoadedModules(base, head),
	]) {
		if (block == null) continue;
		lines.push(block);
		lines.push('');
	}

	lines.push('</details>');
	lines.push('');

	return lines.join('\n');
}

const base = JSON.parse(await readFile(baseFile, 'utf8')) as MemoryReport;
const head = JSON.parse(await readFile(headFile, 'utf8')) as MemoryReport;
const baseJsFootprint = JSON.parse(await readFile(baseJsFootprintFile, 'utf8')) as RuntimeLoadedJsFootprintReport;
const headJsFootprint = JSON.parse(await readFile(headJsFootprintFile, 'utf8')) as RuntimeLoadedJsFootprintReport;
const lines = [
	'## ⚙️ Backend Memory Usage Report',
	'',
];

//const summary = measurementSummary(base, head);
//if (summary != null) {
//	lines.push(summary);
//	lines.push('');
//}

for (const phase of memoryReportPhases) {
	lines.push(`### ${phase.title}`);
	lines.push(renderMainTableForPhase(base, head, phase.key));
	lines.push('');
}

const heapSnapshotSection = renderHeapSnapshotSection(base, head);
if (heapSnapshotSection != null) {
	lines.push(heapSnapshotSection);
	lines.push('');
}

const artifactUrl = process.env.MK_MEMORY_HEAP_SNAPSHOT_ARTIFACT_URL_HEAD!.trim();
lines.push(`[Download representative V8 heap snapshot (head)](${artifactUrl})`);
lines.push('');

const jsFootprintSection = renderJsFootprintSection(baseJsFootprint, headJsFootprint);
if (jsFootprintSection != null) {
	lines.push(jsFootprintSection);
	lines.push('');
}

function getWarningMetric(base: MemoryReport, head: MemoryReport) {
	for (const metric of ['Pss', 'Private_Dirty', 'VmRSS'] as const) {
		if (getMemoryValue(base, 'afterGc', metric) != null && getMemoryValue(head, 'afterGc', metric) != null) {
			return metric;
		}
	}
	return null;
}

function getDiffPercent(base: MemoryReport, head: MemoryReport, phase: typeof memoryReportPhases[number]['key'], metric: typeof metrics[number]) {
	const baseValue = getMemoryValue(base, phase, metric);
	const headValue = getMemoryValue(head, phase, metric);
	if (baseValue == null || headValue == null || baseValue <= 0) return null;

	return ((headValue - baseValue) * 100) / baseValue;
}

function isBeyondSampleNoise(base: MemoryReport, head: MemoryReport, phase: typeof memoryReportPhases[number]['key'], metric: typeof metrics[number]) {
	const baseValue = getMemoryValue(base, phase, metric);
	const headValue = getMemoryValue(head, phase, metric);
	if (baseValue == null || headValue == null) return false;

	const diff = headValue - baseValue;
	if (diff <= 0) return false;

	const baseSpread = getSampleSpread(base, phase, metric);
	const headSpread = getSampleSpread(head, phase, metric);
	if (baseSpread == null || headSpread == null) return true;

	const combinedSpread = Math.hypot(baseSpread, headSpread);
	return diff > combinedSpread * 3;
}

const warningMetric = getWarningMetric(base, head);
const warningDiffPercent = warningMetric == null ? null : getDiffPercent(base, head, 'afterGc', warningMetric);
if (warningMetric != null && warningDiffPercent != null && warningDiffPercent > 5 && isBeyondSampleNoise(base, head, 'afterGc', warningMetric)) {
	lines.push(`⚠️ **Warning**: Memory usage (${warningMetric}) has increased by more than 5% and exceeds the observed sample noise. Please verify this is not an unintended change.`);
	lines.push('');
}

//lines.push(`[See workflow logs for details](https://github.com/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID})`);

await writeFile(outputFile, `${lines.join('\n')}\n`);
