/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { readFile, writeFile } from 'node:fs/promises';
import * as util from './utility.mts';
import { type MemoryReport } from './measure-backend-memory-comparison.mts';

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

const heapSnapshotCategoriesColors = {
	'Total': 'gray',
	'Code': 'orange',
	'Strings': 'red',
	'JS arrays': 'cyan',
	'Typed arrays': 'green',
	'System objects': 'yellow',
	'Other JS objects': 'violet',
	'Other non-JS objects': 'pink',
} as const;

const heapSnapshotCategoriesColorsHex = {
	'Total': '#888888',
	'Code': '#f28e2c',
	'Strings': '#e15759',
	'JS arrays': '#76b7b2',
	'Typed arrays': '#59a14f',
	'System objects': '#edc949',
	'Other JS objects': '#af7aa1',
	'Other non-JS objects': '#ff9da7',
} as const;

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

function getSamplesByRound(report: MemoryReport) {
	const samplesByRound = new Map<number, MemoryReport['samples'][number]>();
	if (!Array.isArray(report.samples)) return samplesByRound;

	for (const sample of report.samples) {
		if (sample.round <= 0) continue;
		samplesByRound.set(sample.round, sample);
	}

	return samplesByRound;
}

function formatDeltaMemory(diffKiB: number) {
	return util.formatColoredDelta(formatMemoryMb(Math.abs(diffKiB)), diffKiB);
}

function pairedDeltaSummary(base: MemoryReport, head: MemoryReport, phase: typeof memoryReportPhases[number]['key'], metric: typeof metrics[number]) {
	const baseSamplesByRound = getSamplesByRound(base);
	const headSamplesByRound = getSamplesByRound(head);
	const values = [];

	for (const [round, baseSample] of baseSamplesByRound) {
		const headSample = headSamplesByRound.get(round);
		if (headSample == null) continue;

		const baseValue = getMemoryValueFromSample(baseSample, phase, metric);
		const headValue = getMemoryValueFromSample(headSample, phase, metric);
		if (baseValue == null || headValue == null) continue;

		values.push(headValue - baseValue);
	}

	return {
		median: util.median(values),
		mad: util.mad(values),
		min: Math.min(...values),
		max: Math.max(...values),
		samples: values.length,
	};
}

function renderMainTableForPhase(base: MemoryReport, head: MemoryReport, phase: typeof memoryReportPhases[number]['key']) {
	const lines = [
		'| Metric | Base | Head | Δ median | Δ MAD | Δ min | Δ max |',
		'| --- | ---: | ---: | ---: | ---: | ---: | ---: |',
	];

	for (const metric of metrics) {
		const baseValue = getMemoryValue(base, phase, metric);
		const headValue = getMemoryValue(head, phase, metric);

		const baseSpread = getSampleSpread(base, phase, metric);
		const headSpread = getSampleSpread(head, phase, metric);
		const summary = pairedDeltaSummary(base, head, phase, metric);
		const percent = summary.median * 100 / baseValue;
		const deltaMedian = summary == null ? '-' : `${formatDeltaMemory(summary.median)}<br>${util.formatDeltaPercent(percent)}`;

		lines.push(`| **${metric}** | ${formatMemoryMb(baseValue)} <br> ± ${formatMemoryMb(baseSpread)} | ${formatMemoryMb(headValue)} <br> ± ${formatMemoryMb(headSpread)} | ${deltaMedian} | ${summary?.mad == null ? '-' : formatMemoryMb(summary.mad)} | ${summary == null ? '-' : formatDeltaMemory(summary.min)} | ${summary == null ? '-' : formatDeltaMemory(summary.max)} |`);
	}

	return lines.join('\n');
}

function getDiffPercent(base: MemoryReport, head: MemoryReport, phase: typeof memoryReportPhases[number]['key'], metric: typeof metrics[number]) {
	const baseValue = getMemoryValue(base, phase, metric);
	const headValue = getMemoryValue(head, phase, metric);
	if (baseValue == null || headValue == null || baseValue <= 0) return null;

	return ((headValue - baseValue) * 100) / baseValue;
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

function formatPlainDelta(baseValue: number, headValue: number, formatter = util.formatNumber) {
	const delta = headValue - baseValue;
	if (delta === 0) return formatter(0);

	const sign = delta > 0 ? '+' : '-';
	return `${sign}${formatter(Math.abs(delta))}`;
}

function getHeapSnapshotCategoryValue(report: MemoryReport, phase: typeof memoryReportPhases[number]['key'], category: typeof util.heapSnapshotCategories[number]) {
	const value = report.summary[phase]?.heapSnapshot?.categories?.[category];
	return Number.isFinite(value) ? value : null;
}

function getHeapSnapshotCategoryValueFromSample(sample: MemoryReport['samples'][number], phase: typeof memoryReportPhases[number]['key'], category: typeof util.heapSnapshotCategories[number]) {
	const value = sample.phases[phase]?.heapSnapshot?.categories?.[category];
	return Number.isFinite(value) ? value : null;
}

const heapSnapshotSankeyChildMinRatio = 0.3;
const heapSnapshotSankeyParentMinPercent = 10;

function escapeCsvValue(value: string) {
	return `"${String(value).replaceAll('"', '""')}"`;
}

function formatSankeyPercentValue(value: number) {
	const rounded = Math.round(value * 100) / 100;
	if (rounded === 0 && value > 0) return '0.01';
	if (Number.isInteger(rounded)) return String(rounded);
	return rounded.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
}

function formatHeapSnapshotSankeyChildLabel(label: string) {
	return String(label).replace(/^[^:]+:\s*/, '');
}

function renderHeapSnapshotSankey(report: MemoryReport, phase: typeof memoryReportPhases[number]['key'], title: string) {
	const total = getHeapSnapshotCategoryValue(report, phase, 'Total');
	if (total == null || total <= 0) return null;

	function getHeapSnapshotBreakdownEntries(category: typeof util.heapSnapshotCategories[number]) {
		const breakdown = report.summary[phase].heapSnapshot?.breakdowns?.[category];
		if (breakdown == null || typeof breakdown !== 'object') return [];

		return Object.entries(breakdown)
			.filter(([, value]) => Number.isFinite(value) && value > 0)
			.toSorted((a, b) => b[1] - a[1]);
	}

	const categories = util.heapSnapshotCategories
		.filter(category => category !== 'Total')
		.map(category => {
			const value = getHeapSnapshotCategoryValue(report, phase, category);
			if (value == null || value <= 0) return null;
			const breakdownEntries = getHeapSnapshotBreakdownEntries(category);
			const breakdownTotal = breakdownEntries.reduce((sum, [, childValue]) => sum + childValue, 0);
			const percent = (value * 100) / total;
			const childEntries = [];
			let otherPercent = 0;

			if (breakdownTotal > 0 && percent > heapSnapshotSankeyParentMinPercent) {
				for (const [childName, childValue] of breakdownEntries) {
					const childRatio = childValue / breakdownTotal;
					const childPercent = percent * childRatio;
					if (childRatio >= heapSnapshotSankeyChildMinRatio) {
						childEntries.push([formatHeapSnapshotSankeyChildLabel(childName), childPercent]);
					} else {
						otherPercent += childPercent;
					}
				}

				if (childEntries.length > 0 && otherPercent > 0) {
					childEntries.push(['Other', otherPercent]);
				}
			}

			return {
				category,
				percent,
				childEntries,
			};
		})
		.filter(value => value != null);

	if (categories.length === 0) return null;

	const nodeColors = {
		[title]: heapSnapshotCategoriesColorsHex.Total,
	} as Record<string, string>;
	for (const { category, childEntries } of categories) {
		const categoryColor = heapSnapshotCategoriesColorsHex[category] ?? heapSnapshotCategoriesColorsHex.Total;
		nodeColors[category] = categoryColor;

		for (const [childName] of childEntries) {
			nodeColors[childName] = categoryColor;
		}
	}

	const lines = [
		`<details><summary>${title} heap snapshot composition</summary>`,
		'',
		'```mermaid',
		`%%{init: ${JSON.stringify({
			sankey: {
				showValues: false,
				linkColor: 'target',
				labelStyle: 'outlined',
				nodeAlignment: 'center',
				nodePadding: 10,
				nodeColors: {
					...nodeColors,
					'Other': '#888888',
				},
			},
		})}}%%`,
		'sankey-beta',
	];

	for (const { category, percent, childEntries } of categories) {
		lines.push(`${escapeCsvValue(title)},${escapeCsvValue(category)},${formatSankeyPercentValue(percent)}`);

		for (const [childName, childPercent] of childEntries) {
			lines.push(`${escapeCsvValue(category)},${escapeCsvValue(childName)},${formatSankeyPercentValue(childPercent)}`);
		}
	}

	lines.push('```');
	lines.push('');
	lines.push('</details>');

	return lines.join('\n');
}

function pairedHeapSnapshotDeltaSummary(base: MemoryReport, head: MemoryReport, phase: typeof memoryReportPhases[number]['key'], category: typeof util.heapSnapshotCategories[number]) {
	const baseSamplesByRound = getSamplesByRound(base);
	const headSamplesByRound = getSamplesByRound(head);
	const values = [] as number[];

	for (const [round, baseSample] of baseSamplesByRound) {
		const headSample = headSamplesByRound.get(round);
		if (headSample == null) continue;

		const baseValue = getHeapSnapshotCategoryValueFromSample(baseSample, phase, category);
		const headValue = getHeapSnapshotCategoryValueFromSample(headSample, phase, category);
		if (baseValue == null || headValue == null) continue;

		values.push(headValue - baseValue);
	}

	return {
		median: util.median(values),
		mad: util.mad(values),
		min: Math.min(...values),
		max: Math.max(...values),
		samples: values.length,
	};
}

function renderHeapSnapshotTable(base: MemoryReport, head: MemoryReport, phase: typeof memoryReportPhases[number]['key']) {
	const lines = [
		'| Metric | Base | Head | Δ median | Δ MAD | Δ min | Δ max |',
		'| --- | ---: | ---: | ---: | ---: | ---: | ---: |',
	];
	const baseTotal = getHeapSnapshotCategoryValue(base, phase, 'Total');
	const headTotal = getHeapSnapshotCategoryValue(head, phase, 'Total');

	function formatHeapSnapshotCategoryLabel(category: typeof heapSnapshotCategories[number], baseValue: number, headValue: number, baseTotal: number, headTotal: number) {
		if (category === 'Total' || baseTotal == null || headTotal == null || baseTotal <= 0 || headTotal <= 0) return `**${category}**`;

		const basePercent = util.formatPercent((baseValue * 100) / baseTotal);
		const headPercent = util.formatPercent((headValue * 100) / headTotal);
		return `**${category}**<br>${basePercent} → ${headPercent}`;
	}

	function getHeapSnapshotSampleSpread(report: MemoryReport, phase: typeof memoryReportPhases[number]['key'], category: typeof util.heapSnapshotCategories[number]) {
		const values = report.samples
			.map(sample => getHeapSnapshotCategoryValueFromSample(sample, phase, category))
			.filter(value => Number.isFinite(value)) as number[];
		if (values.length < 2) return null;

		const center = util.median(values);
		return util.median(values.map(value => Math.abs(value - center)));
	}

	for (const category of util.heapSnapshotCategories) {
		const baseValue = getHeapSnapshotCategoryValue(base, phase, category);
		const headValue = getHeapSnapshotCategoryValue(head, phase, category);
		if (baseValue == null || headValue == null) continue;

		const baseSpread = getHeapSnapshotSampleSpread(base, phase, category);
		const headSpread = getHeapSnapshotSampleSpread(head, phase, category);
		const summary = pairedHeapSnapshotDeltaSummary(base, head, phase, category);
		const percent = summary.median * 100 / baseValue;
		const deltaMedian = summary == null ? '-' : `${util.formatDeltaBytes(summary.median)}<br>${util.formatDeltaPercent(percent)}`;
		const categoryLabel = formatHeapSnapshotCategoryLabel(category, baseValue, headValue, baseTotal, headTotal);

		lines.push(`| $\\color{${heapSnapshotCategoriesColors[category]}}{\\rule{8pt}{8pt}}$ ${categoryLabel} | ${util.formatBytes(baseValue)} <br> ± ${baseSpread == null ? '-' : util.formatBytes(baseSpread)} | ${util.formatBytes(headValue)} <br> ± ${headSpread == null ? '-' : util.formatBytes(headSpread)} | ${deltaMedian} | ${summary?.mad == null ? '-' : util.formatBytes(summary.mad)} | ${summary == null ? '-' : util.formatDeltaBytes(summary.min)} | ${summary == null ? '-' : util.formatDeltaBytes(summary.max)} |`);
		if (category === 'Total') {
			lines.push('| | | | | | | |');
		}
	}

	if (lines.length === 2) return null;
	return lines.join('\n');
}

function renderHeapSnapshotSection(base: MemoryReport, head: MemoryReport) {
	const table = renderHeapSnapshotTable(base, head, 'afterGc');
	if (table == null) return null;

	const lines = [
		'### V8 Heap Snapshot Statistics',
		'',
		table,
		'',
	];

	for (const graph of [
		renderHeapSnapshotSankey(base, 'afterGc', 'Base'),
		renderHeapSnapshotSankey(head, 'afterGc', 'Head'),
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

		lines.push(`| **${title}** | ${formatter(baseValue)} | ${formatter(headValue)} | ${formatPlainDelta(baseValue, headValue, formatter)} | ${util.calcAndFormatDeltaPercent(baseValue, headValue)} |`);
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
		lines.push(`| ${packageDisplayName(packageSummary)} | ${util.formatBytes(packageSummary.baseSourceBytes)} | ${util.formatBytes(packageSummary.sourceBytes)} | ${formatPlainDelta(packageSummary.baseSourceBytes, packageSummary.sourceBytes, util.formatBytes)} | ${formatPlainDelta(packageSummary.baseModules, packageSummary.modules)} |`);
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

lines.push(`[See workflow logs for details](https://github.com/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID})`);

await writeFile(outputFile, `${lines.join('\n')}\n`);
