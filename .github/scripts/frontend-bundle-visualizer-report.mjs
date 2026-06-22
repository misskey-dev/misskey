import { readFile, writeFile } from 'node:fs/promises';

const [beforeFile, afterFile, outputFile] = process.argv.slice(2);

if (beforeFile == null || afterFile == null || outputFile == null) {
	console.error('Usage: node .github/scripts/frontend-bundle-visualizer-report.mjs <before-stats.json> <after-stats.json> <report.md>');
	process.exit(1);
}

const byteFormatter = new Intl.NumberFormat('en-US');
const numberFormatter = new Intl.NumberFormat('en-US');

function formatBytes(value) {
	if (!Number.isFinite(value) || value <= 0) return '0 B';

	const units = ['B', 'KiB', 'MiB', 'GiB'];
	let unitIndex = 0;
	let size = value;
	while (size >= 1024 && unitIndex < units.length - 1) {
		size /= 1024;
		unitIndex += 1;
	}

	const maximumFractionDigits = size >= 10 || unitIndex === 0 ? 0 : 1;
	return `${byteFormatter.format(Number(size.toFixed(maximumFractionDigits)))} ${units[unitIndex]}`;
}

function formatNumber(value) {
	return numberFormatter.format(value);
}

function formatPercent(value) {
	return `${Math.round(value)}%`;
}

function sharePercent(value, total) {
	if (total === 0) return '0%';
	return formatPercent((value / total) * 100);
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

function formatDiff(before, after, formatter) {
	const diff = after - before;
	if (diff === 0) return formatter(0);

	const sign = diff > 0 ? '+' : '-';
	return formatColoredDiff(`${sign}${formatter(Math.abs(diff))}`, diff);
}

function formatDiffPercent(before, after) {
	if (before === 0 && after === 0) return '0%';
	if (before === 0) return '-';

	const diff = after - before;
	if (diff === 0) return '0%';

	const sign = diff > 0 ? '+' : '-';
	return formatColoredDiff(`${sign}${formatPercent(Math.abs(diff / before) * 100)}`, diff);
}

function tableCell(value) {
	return String(value).replaceAll('|', '\\|').replaceAll('\r', ' ').replaceAll('\n', ' ');
}

function code(value) {
	const sanitized = String(value).replaceAll('\r', ' ').replaceAll('\n', ' ');
	const backtickRuns = sanitized.match(/`+/g) ?? [];
	const fenceLength = Math.max(1, ...backtickRuns.map((run) => run.length + 1));
	const fence = '`'.repeat(fenceLength);
	const padding = sanitized.startsWith('`') || sanitized.endsWith('`') ? ' ' : '';

	return `${fence}${padding}${sanitized}${padding}${fence}`;
}

function tableCode(value) {
	return tableCell(code(value));
}

function collectReport(data) {
	const nodeParts = data.nodeParts ?? {};
	const nodeMetas = Object.values(data.nodeMetas ?? {});
	const moduleRows = [];
	const bundleMap = new Map();

	for (const meta of nodeMetas) {
		const row = {
			id: meta.id,
			bundles: 0,
			renderedLength: 0,
			gzipLength: 0,
			brotliLength: 0,
			importedByCount: meta.importedBy?.length ?? 0,
			importedCount: meta.imported?.length ?? 0,
		};

		for (const [bundleId, partUid] of Object.entries(meta.moduleParts ?? {})) {
			const part = nodeParts[partUid];
			if (part == null) continue;

			row.bundles += 1;
			row.renderedLength += part.renderedLength;
			row.gzipLength += part.gzipLength;
			row.brotliLength += part.brotliLength;

			const bundle = bundleMap.get(bundleId) ?? {
				id: bundleId,
				modules: 0,
				renderedLength: 0,
				gzipLength: 0,
				brotliLength: 0,
			};
			bundle.modules += 1;
			bundle.renderedLength += part.renderedLength;
			bundle.gzipLength += part.gzipLength;
			bundle.brotliLength += part.brotliLength;
			bundleMap.set(bundleId, bundle);
		}

		if (row.bundles > 0) {
			moduleRows.push(row);
		}
	}

	let staticImports = 0;
	let dynamicImports = 0;
	for (const meta of nodeMetas) {
		for (const imported of meta.imported ?? []) {
			if (imported.dynamic) {
				dynamicImports += 1;
			} else {
				staticImports += 1;
			}
		}
	}

	const bundleRows = [...bundleMap.values()].sort((a, b) => b.renderedLength - a.renderedLength);
	const hotModules = [...moduleRows].sort((a, b) => b.renderedLength - a.renderedLength);
	const totalRendered = moduleRows.reduce((sum, row) => sum + row.renderedLength, 0);
	const totalGzip = moduleRows.reduce((sum, row) => sum + row.gzipLength, 0);
	const totalBrotli = moduleRows.reduce((sum, row) => sum + row.brotliLength, 0);

	return {
		options: data.options ?? {},
		summary: {
			bundles: bundleRows.length,
			modules: moduleRows.length,
			entries: nodeMetas.filter((meta) => meta.isEntry).length,
			externals: nodeMetas.filter((meta) => meta.isExternal).length,
			staticImports,
			dynamicImports,
		},
		metrics: {
			renderedLength: totalRendered,
			gzipLength: totalGzip,
			brotliLength: totalBrotli,
		},
		hotModules,
	};
}

function renderSummaryTable(before, after) {
	const metrics = [
		{ key: 'bundles', label: 'Bundles' },
		{ key: 'modules', label: 'Modules' },
		{ key: 'entries', label: 'Entries' },
		{ key: 'externals', label: 'Externals' },
		{ key: 'staticImports', label: 'Static Imports' },
		{ key: 'dynamicImports', label: 'Dynamic Imports' },
	];

	return [
		`| | ${metrics.map((metric) => metric.label).join(' | ')} |`,
		`|---|${metrics.map(() => '---:').join('|')}|`,
		`| Before | ${metrics.map((metric) => formatNumber(before.summary[metric.key])).join(' | ')} |`,
		`| After | ${metrics.map((metric) => formatNumber(after.summary[metric.key])).join(' | ')} |`,
		`| Diff | ${metrics.map((metric) => formatDiff(before.summary[metric.key], after.summary[metric.key], formatNumber)).join(' | ')} |`,
		`| Diff (%) | ${metrics.map((metric) => formatDiffPercent(before.summary[metric.key], after.summary[metric.key])).join(' | ')} |`,
	];
}

function renderMetricTable(before, after) {
	const metrics = [
		{ key: 'renderedLength', label: 'Rendered size' },
	];
	if (before.options.gzip || after.options.gzip) {
		metrics.push({ key: 'gzipLength', label: 'Gzip size' });
	}
	if (before.options.brotli || after.options.brotli) {
		metrics.push({ key: 'brotliLength', label: 'Brotli size' });
	}

	const lines = [
		'| Metric | Before | After | Diff | Diff (%) |',
		'|---|---:|---:|---:|---:|',
	];
	for (const metric of metrics) {
		const beforeValue = before.metrics[metric.key];
		const afterValue = after.metrics[metric.key];
		lines.push(`| ${metric.label} | ${formatBytes(beforeValue)} | ${formatBytes(afterValue)} | ${formatDiff(beforeValue, afterValue, formatBytes)} | ${formatDiffPercent(beforeValue, afterValue)} |`);
	}

	return lines;
}

const beforeData = JSON.parse(await readFile(beforeFile, 'utf8'));
const afterData = JSON.parse(await readFile(afterFile, 'utf8'));
const before = collectReport(beforeData);
const after = collectReport(afterData);
const lines = [
	'# Bundle Report',
	'',
	...renderSummaryTable(before, after),
	'',
	...renderMetricTable(before, after),
	'',
	'## Top 10',
	'',
];

for (const row of after.hotModules.slice(0, 10)) {
	lines.push(`- ${code(row.id)}: ${sharePercent(row.renderedLength, after.metrics.renderedLength)} (${formatBytes(row.renderedLength)})`);
}

lines.push(
	'',
	'## Hot Modules (Self Size)',
	'',
	'| Module | Bundles | Rendered | Share | Gzip | Brotli | Imports | Imported By |',
	'|---|---:|---:|---:|---:|---:|---:|---:|',
);

for (const row of after.hotModules.slice(0, 15)) {
	lines.push(`| ${tableCode(row.id)} | ${row.bundles} | ${formatBytes(row.renderedLength)} | ${sharePercent(row.renderedLength, after.metrics.renderedLength)} | ${formatBytes(row.gzipLength)} | ${formatBytes(row.brotliLength)} | ${row.importedCount} | ${row.importedByCount} |`);
}

await writeFile(outputFile, `${lines.join('\n')}\n`);
