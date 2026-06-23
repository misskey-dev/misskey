import { readFile, writeFile } from 'node:fs/promises';

const [baseFile, headFile, outputFile] = process.argv.slice(2);

if (baseFile == null || headFile == null || outputFile == null) {
	console.error('Usage: node .github/scripts/backend-memory-report.mjs <base-memory.json> <head-memory.json> <report.md>');
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
	'HeapTotal',
	'External',
	'Pss',
	'Private_Dirty',
];

function formatNumber(value) {
	return numberFormatter.format(value);
}

function formatMemory(valueKiB) {
	return `${formatNumber(valueKiB / 1024)} MB`;
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
	return `$\\color{${color}}{\\text{${formatMathText(text)}}}$`;
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

function renderTable(base, head, phase) {
	const lines = [
		'| Metric | Base | Head | Δ | Δ (%) |',
		'| --- | ---: | ---: | ---: | ---: |',
	];

	for (const metric of metrics) {
		const baseValue = getMemoryValue(base, phase, metric);
		const headValue = getMemoryValue(head, phase, metric);
		if (baseValue == null || headValue == null) continue;

		lines.push(`| ${metric} | ${formatMemory(baseValue)} | ${formatMemory(headValue)} | ${formatDiff(baseValue, headValue)} | ${formatDiffPercent(baseValue, headValue)} |`);
	}

	return lines.join('\n');
}

function getDiffPercent(base, head, phase, metric) {
	const baseValue = getMemoryValue(base, phase, metric);
	const headValue = getMemoryValue(head, phase, metric);
	if (baseValue == null || headValue == null || baseValue <= 0) return null;

	return ((headValue - baseValue) * 100) / baseValue;
}

function getWarningMetric(base, head) {
	for (const metric of ['Pss', 'VmRSS']) {
		if (getMemoryValue(base, 'afterGc', metric) != null && getMemoryValue(head, 'afterGc', metric) != null) {
			return metric;
		}
	}
	return null;
}

function workflowFooter() {
	const repository = process.env.GITHUB_REPOSITORY;
	const runId = process.env.GITHUB_RUN_ID;
	if (repository == null || runId == null) {
		return 'See workflow logs for details.';
	}

	return `[See workflow logs for details](https://github.com/${repository}/actions/runs/${runId})`;
}

const base = JSON.parse(await readFile(baseFile, 'utf8'));
const head = JSON.parse(await readFile(headFile, 'utf8'));
const lines = [
	'## Backend Memory Usage Report',
	'',
];

for (const phase of phases) {
	lines.push(`### ${phase.title}`);
	lines.push(renderTable(base, head, phase.key));
	lines.push('');
}

const warningMetric = getWarningMetric(base, head);
const warningDiffPercent = warningMetric == null ? null : getDiffPercent(base, head, 'afterGc', warningMetric);
if (warningMetric != null && warningDiffPercent != null && warningDiffPercent > 5) {
	lines.push(`⚠️ **Warning**: Memory usage (${warningMetric}) has increased by more than 5%. Please verify this is not an unintended change.`);
	lines.push('');
}

lines.push(workflowFooter());

await writeFile(outputFile, `${lines.join('\n')}\n`);
