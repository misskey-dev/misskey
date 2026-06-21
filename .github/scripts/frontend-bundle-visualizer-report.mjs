import { readFile, writeFile } from 'node:fs/promises';

const inputFile = process.argv[2];
const outputFile = process.argv[3];

if (inputFile == null || outputFile == null) {
	console.error('Usage: node .github/scripts/frontend-bundle-visualizer-report.mjs <stats.json> <report.md>');
	process.exit(1);
}

const byteFormatter = new Intl.NumberFormat('en-US');

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

function formatPercent(value) {
	return `${value.toFixed(1)}%`;
}

function sharePercent(value, total) {
	if (total === 0) return '0.0%';
	return formatPercent((value / total) * 100);
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

const data = JSON.parse(await readFile(inputFile, 'utf8'));
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
		parts: [],
	};

	for (const [bundleId, partUid] of Object.entries(meta.moduleParts ?? {})) {
		const part = nodeParts[partUid];
		if (part == null) continue;

		row.bundles += 1;
		row.renderedLength += part.renderedLength;
		row.gzipLength += part.gzipLength;
		row.brotliLength += part.brotliLength;
		row.parts.push({ bundleId, ...part });

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

const bundleRows = [...bundleMap.values()].sort((a, b) => b.renderedLength - a.renderedLength);
const hotModules = [...moduleRows].sort((a, b) => b.renderedLength - a.renderedLength);

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

const totalRendered = moduleRows.reduce((sum, row) => sum + row.renderedLength, 0);
const totalGzip = moduleRows.reduce((sum, row) => sum + row.gzipLength, 0);
const totalBrotli = moduleRows.reduce((sum, row) => sum + row.brotliLength, 0);
const entries = nodeMetas.filter((meta) => meta.isEntry).length;
const externals = nodeMetas.filter((meta) => meta.isExternal).length;

const lines = [
	'# Bundle Report',
	'',
	'| Bundles | Modules | Entries | Externals | Static Imports | Dynamic Imports |',
	'|---:|---:|---:|---:|---:|---:|',
	`| ${bundleRows.length} | ${moduleRows.length} | ${entries} | ${externals} | ${staticImports} | ${dynamicImports} |`,
	'',
	'| Metric | Total |',
	'|---|---:|',
	`| Rendered size | ${formatBytes(totalRendered)} |`,
];

if (data.options?.gzip) {
	lines.push(`| Gzip size | ${formatBytes(totalGzip)} |`);
}
if (data.options?.brotli) {
	lines.push(`| Brotli size | ${formatBytes(totalBrotli)} |`);
}

lines.push('', '## Top 10', '');
for (const row of hotModules.slice(0, 10)) {
	lines.push(`- ${code(row.id)}: ${sharePercent(row.renderedLength, totalRendered)} (${formatBytes(row.renderedLength)})`);
}

lines.push(
	'',
	'## Hot Modules (Self Size)',
	'',
	'| Module | Bundles | Rendered | Share | Gzip | Brotli | Imports | Imported By |',
	'|---|---:|---:|---:|---:|---:|---:|---:|',
);

for (const row of hotModules.slice(0, 15)) {
	lines.push(`| ${tableCode(row.id)} | ${row.bundles} | ${formatBytes(row.renderedLength)} | ${sharePercent(row.renderedLength, totalRendered)} | ${formatBytes(row.gzipLength)} | ${formatBytes(row.brotliLength)} | ${row.importedCount} | ${row.importedByCount} |`);
}

await writeFile(outputFile, `${lines.join('\n')}\n`);
