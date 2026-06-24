import { readFile, writeFile } from 'node:fs/promises';

const [baseFile, headFile, outputFile, baseJsFootprintFile, headJsFootprintFile] = process.argv.slice(2);

if (baseFile == null || headFile == null || outputFile == null) {
	console.error('Usage: node .github/scripts/backend-memory-report.mjs <base-memory.json> <head-memory.json> <report.md> [base-js-footprint.json head-js-footprint.json]');
	process.exit(1);
}

const numberFormatter = new Intl.NumberFormat('en-US', {
	maximumFractionDigits: 2,
});

const phases = [
	{
		key: 'afterGc',
		title: 'After GC',
	},
];

const metrics = [
	'HeapUsed',
	'Pss',
	'Private_Dirty',
	'VmRSS',
	'External',
];

function formatNumber(value) {
	return numberFormatter.format(value);
}

function formatMemory(valueKiB) {
	return `${formatNumber(valueKiB / 1024)} MB`;
}

function formatBytes(value) {
	if (!Number.isFinite(value)) return '-';
	if (value < 1024) return `${formatNumber(value)} B`;
	if (value < 1024 * 1024) return `${formatNumber(value / 1024)} KiB`;
	return `${formatNumber(value / 1024 / 1024)} MiB`;
}

function formatPercent(value) {
	return `${formatNumber(value)}%`;
}

function formatMathText(text) {
	return text
		.replaceAll('\\', '\\\\')
		.replaceAll('{', '\\{')
		.replaceAll('}', '\\}')
		.replaceAll('%', '\\%');
}

function formatColoredDiff(text, diff) {
	const color = diff > 0 ? 'orange' : 'green';
	return `$\\color{${color}}{\\text{${formatMathText(text).replaceAll('\\%', '\\\\%')}}}$`;
}

function formatDiff(baseKiB, headKiB) {
	const diff = headKiB - baseKiB;
	if (diff === 0) return formatMemory(0);

	const sign = diff > 0 ? '+' : '-';
	return formatColoredDiff(`${sign}${formatMemory(Math.abs(diff))}`, diff);
}

function formatDiffPercent(baseKiB, headKiB) {
	const diff = headKiB - baseKiB;
	if (diff === 0) return '0%';
	if (baseKiB <= 0) return '-';

	const sign = diff > 0 ? '+' : '-';
	return formatColoredDiff(`${sign}${formatPercent(Math.abs((diff * 100) / baseKiB))}`, diff);
}

function getMemoryValue(report, phase, metric) {
	const value = report?.[phase]?.[metric];
	return Number.isFinite(value) ? value : null;
}

function median(values) {
	const sorted = values.toSorted((a, b) => a - b);
	const center = Math.floor(sorted.length / 2);
	if (sorted.length % 2 === 1) return sorted[center];
	return Math.round((sorted[center - 1] + sorted[center]) / 2);
}

function getSampleValues(report, phase, metric) {
	if (!Array.isArray(report?.samples)) return [];

	return report.samples
		.map(sample => getMemoryValue(sample, phase, metric))
		.filter(value => Number.isFinite(value));
}

function getSampleSpread(report, phase, metric) {
	const values = getSampleValues(report, phase, metric);
	if (values.length < 2) return null;

	const center = median(values);
	return median(values.map(value => Math.abs(value - center)));
}

function mad(values) {
	if (values.length < 2) return null;

	const center = median(values);
	return median(values.map(value => Math.abs(value - center)));
}

function getSamplesByRound(report) {
	const samplesByRound = new Map();
	if (!Array.isArray(report?.samples)) return samplesByRound;

	for (const sample of report.samples) {
		if (!Number.isInteger(sample?.round) || sample.round <= 0) continue;
		samplesByRound.set(sample.round, sample);
	}

	return samplesByRound;
}

function getPairedDeltaValues(base, head, phase, metric) {
	const baseSamplesByRound = getSamplesByRound(base);
	const headSamplesByRound = getSamplesByRound(head);
	const values = [];

	for (const [round, baseSample] of baseSamplesByRound) {
		const headSample = headSamplesByRound.get(round);
		if (headSample == null) continue;

		const baseValue = getMemoryValue(baseSample, phase, metric);
		const headValue = getMemoryValue(headSample, phase, metric);
		if (baseValue == null || headValue == null) continue;

		values.push(headValue - baseValue);
	}

	return values;
}

function formatDeltaMemory(diffKiB) {
	if (diffKiB === 0) return formatMemory(0);

	const sign = diffKiB > 0 ? '+' : '-';
	return formatColoredDiff(`${sign}${formatMemory(Math.abs(diffKiB))}`, diffKiB);
}

function pairedDeltaSummary(base, head, phase, metric) {
	const values = getPairedDeltaValues(base, head, phase, metric);
	if (values.length === 0) return null;

	return {
		median: median(values),
		mad: mad(values),
		min: Math.min(...values),
		max: Math.max(...values),
		samples: values.length,
	};
}

function renderTable(base, head, phase) {
	const lines = [
		'| Metric | Base | Head | Δ | Δ (%) |',
		'| --- | ---: | ---: | ---: | ---: |',
	];

	for (const metric of metrics) {
		const baseValue = getMemoryValue(base, phase, metric);
		const headValue = getMemoryValue(head, phase, metric);
		if (baseValue == null || headValue == null) continue;

		const baseSpread = getSampleSpread(base, phase, metric);
		const headSpread = getSampleSpread(head, phase, metric);

		lines.push(`| ${metric} | ${formatMemory(baseValue)} <br> ± ${formatMemory(baseSpread)} | ${formatMemory(headValue)} <br> ± ${formatMemory(headSpread)} | ${formatDiff(baseValue, headValue)} | ${formatDiffPercent(baseValue, headValue)} |`);
	}

	return lines.join('\n');
}

function renderPairedDeltaTable(base, head, phase) {
	const lines = [
		'| Metric | Δ median | Δ MAD | Δ min | Δ max |',
		'| --- | ---: | ---: | ---: | ---: |',
	];

	for (const metric of metrics) {
		const summary = pairedDeltaSummary(base, head, phase, metric);
		if (summary == null) continue;

		lines.push(`| ${metric} | ${formatDeltaMemory(summary.median)} | ${summary.mad == null ? '-' : formatMemory(summary.mad)} | ${formatDeltaMemory(summary.min)} | ${formatDeltaMemory(summary.max)} |`);
	}

	if (lines.length === 2) return null;
	return lines.join('\n');
}

function getDiffPercent(base, head, phase, metric) {
	const baseValue = getMemoryValue(base, phase, metric);
	const headValue = getMemoryValue(head, phase, metric);
	if (baseValue == null || headValue == null || baseValue <= 0) return null;

	return ((headValue - baseValue) * 100) / baseValue;
}

function getWarningMetric(base, head) {
	for (const metric of ['Pss', 'Private_Dirty', 'VmRSS']) {
		if (getMemoryValue(base, 'afterGc', metric) != null && getMemoryValue(head, 'afterGc', metric) != null) {
			return metric;
		}
	}
	return null;
}

function isBeyondSampleNoise(base, head, phase, metric) {
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

function workflowFooter() {
	const repository = process.env.GITHUB_REPOSITORY;
	const runId = process.env.GITHUB_RUN_ID;
	if (repository == null || runId == null) {
		return 'See workflow logs for details.';
	}

	return `[See workflow logs for details](https://github.com/${repository}/actions/runs/${runId})`;
}

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

function formatPlainDiff(baseValue, headValue, formatter = formatNumber) {
	const diff = headValue - baseValue;
	if (diff === 0) return formatter(0);

	const sign = diff > 0 ? '+' : '-';
	return `${sign}${formatter(Math.abs(diff))}`;
}

function formatPlainDiffPercent(baseValue, headValue) {
	const diff = headValue - baseValue;
	if (diff === 0) return '0%';
	if (baseValue <= 0) return '-';

	const sign = diff > 0 ? '+' : '-';
	return `${sign}${formatPercent(Math.abs((diff * 100) / baseValue))}`;
}

function getJsFootprintValue(report, phase, key) {
	const value = report?.[phase]?.totals?.[key];
	return Number.isFinite(value) ? value : null;
}

function renderJsFootprintMetricTable(base, head) {
	const metricRows = [
		['Loaded JS modules', 'loadedJsModules', formatNumber],
		['Loaded JS source', 'loadedJsSourceBytes', formatBytes],
		//['Loaded JS gzip estimate', 'loadedJsGzipBytes', formatBytes],
		//['AST nodes', 'astNodeCount', formatNumber],
		//['Functions', 'functionCount', formatNumber],
		//['Classes', 'classCount', formatNumber],
		//['String literals', 'stringLiteralBytes', formatBytes],
		['External packages loaded', 'externalPackageCount', formatNumber],
		['Native addon packages', 'nativeAddonPackageCount', formatNumber],
	];

	const lines = [
		'| Metric | Base | Head | Δ | Δ (%) |',
		'| --- | ---: | ---: | ---: | ---: |',
	];

	for (const [title, key, formatter] of metricRows) {
		const baseValue = getJsFootprintValue(base, 'afterRequest', key);
		const headValue = getJsFootprintValue(head, 'afterRequest', key);
		if (baseValue == null || headValue == null) continue;

		lines.push(`| ${title} | ${formatter(baseValue)} | ${formatter(headValue)} | ${formatPlainDiff(baseValue, headValue, formatter)} | ${formatPlainDiffPercent(baseValue, headValue)} |`);
	}

	return lines.join('\n');
}

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

		lines.push(`| ${title} | ${formatNumber(baseModules)} | ${formatNumber(headModules)} | ${formatPlainDiff(baseModules, headModules)} | ${formatBytes(baseSource)} | ${formatBytes(headSource)} | ${formatPlainDiff(baseSource, headSource, formatBytes)} |`);
	}

	return lines.join('\n');
}

function packageMap(report) {
	const map = new Map();
	for (const packageSummary of report?.afterRequest?.packages ?? []) {
		if (packageSummary?.category !== 'external' || typeof packageSummary.name !== 'string') continue;
		map.set(packageSummary.name, packageSummary);
	}
	return map;
}

function packageDisplayName(packageSummary) {
	if (packageSummary.version == null) return packageSummary.name;
	return `${packageSummary.name} ${packageSummary.version}`;
}

function renderNewExternalPackages(base, head) {
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
		lines.push(`| ${packageDisplayName(packageSummary)} | ${formatBytes(packageSummary.sourceBytes)} | ${formatNumber(packageSummary.modules)} | ${packageSummary.nativeAddon ? 'native addon' : ''} |`);
	}

	return lines.join('\n');
}

function renderLargestPackageIncreases(base, head) {
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
		lines.push(`| ${packageDisplayName(packageSummary)} | ${formatBytes(packageSummary.baseSourceBytes)} | ${formatBytes(packageSummary.sourceBytes)} | ${formatPlainDiff(packageSummary.baseSourceBytes, packageSummary.sourceBytes, formatBytes)} | ${formatPlainDiff(packageSummary.baseModules, packageSummary.modules)} |`);
	}

	return lines.join('\n');
}

function moduleMap(report) {
	const map = new Map();
	for (const moduleSummary of report?.afterRequest?.modules ?? []) {
		if (typeof moduleSummary.path !== 'string') continue;
		map.set(moduleSummary.path, moduleSummary);
	}
	return map;
}

function renderNewLoadedModules(base, head) {
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
		lines.push(`| \`${moduleSummary.path}\` | ${moduleSummary.package} | ${formatBytes(moduleSummary.sourceBytes)} |`);
	}

	return lines.join('\n');
}

function renderJsFootprintSection(base, head) {
	if (base == null || head == null) return null;

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

const base = JSON.parse(await readFile(baseFile, 'utf8'));
const head = JSON.parse(await readFile(headFile, 'utf8'));
const baseJsFootprint = baseJsFootprintFile == null ? null : JSON.parse(await readFile(baseJsFootprintFile, 'utf8'));
const headJsFootprint = headJsFootprintFile == null ? null : JSON.parse(await readFile(headJsFootprintFile, 'utf8'));
const lines = [
	'## Backend Memory Usage Report',
	'',
];

//const summary = measurementSummary(base, head);
//if (summary != null) {
//	lines.push(summary);
//	lines.push('');
//}

for (const phase of phases) {
	lines.push(`### ${phase.title}`);
	lines.push(renderTable(base, head, phase.key));
	lines.push('');

	const pairedDeltaTable = renderPairedDeltaTable(base, head, phase.key);
	if (pairedDeltaTable != null) {
		lines.push('#### Paired Delta Summary');
		lines.push('');
		lines.push(pairedDeltaTable);
		lines.push('');
	}
}

const jsFootprintSection = renderJsFootprintSection(baseJsFootprint, headJsFootprint);
if (jsFootprintSection != null) {
	lines.push(jsFootprintSection);
	lines.push('');
}

const warningMetric = getWarningMetric(base, head);
const warningDiffPercent = warningMetric == null ? null : getDiffPercent(base, head, 'afterGc', warningMetric);
if (warningMetric != null && warningDiffPercent != null && warningDiffPercent > 5 && isBeyondSampleNoise(base, head, 'afterGc', warningMetric)) {
	lines.push(`⚠️ **Warning**: Memory usage (${warningMetric}) has increased by more than 5% and exceeds the observed sample noise. Please verify this is not an unintended change.`);
	lines.push('');
}

lines.push(workflowFooter());

await writeFile(outputFile, `${lines.join('\n')}\n`);
