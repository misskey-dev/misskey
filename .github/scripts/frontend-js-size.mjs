/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';

const marker = '<!-- misskey-frontend-js-size -->';
const locale = process.env.FRONTEND_JS_SIZE_LOCALE || 'ja-JP';
const byteFormatter = new Intl.NumberFormat('en-US');
const numberFormatter = new Intl.NumberFormat('en-US');

function normalizePath(filePath) {
	return filePath.split(path.sep).join('/');
}

async function exists(filePath) {
	try {
		await fs.access(filePath);
		return true;
	} catch {
		return false;
	}
}

async function fileSize(filePath) {
	const stat = await fs.stat(filePath);
	return stat.size;
}

async function* walk(dir) {
	for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
		const fullPath = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			yield* walk(fullPath);
		} else if (entry.isFile()) {
			yield fullPath;
		}
	}
}

function formatNumber(value) {
	return numberFormatter.format(value);
}

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

function escapeLatex(text) {
	return text
		.replaceAll('\\', '\\\\')
		.replaceAll('{', '\\{')
		.replaceAll('}', '\\}')
		.replaceAll('%', '\\%');
}

function formatColoredDiff(text, diff) {
	if (diff === 0) return text;
	const color = diff > 0 ? 'orange' : 'green';
	const sign = diff > 0 ? '+' : '-';
	return `$\\color{${color}}{\\text{${sign}${escapeLatex(text)}}}$`;
}

function formatNumberDiff(before, after) {
	if (before == null || after == null) return '-';
	const diff = after - before;
	return formatColoredDiff(formatNumber(Math.abs(diff)), diff);
}

function formatBytesDiff(before, after) {
	if (before == null || after == null) return '-';
	const diff = after - before;
	if (diff === 0) return '0 B';
	return formatColoredDiff(formatBytes(Math.abs(diff)), diff);
}

function formatDiffPercent(before, after) {
	if (before == null || before === 0 || after == null || after === 0) return '-';
	const diff = after - before;
	if (diff === 0) return `0%`;
	const percent = Math.abs(Math.round(diff / before * 100));
	return formatColoredDiff(`${percent}%`, diff);
}

function sharePercent(value, total) {
	if (total === 0) return '0%';
	return Math.round((value / total) * 100) + '%';
}

function escapeCell(value) {
	return String(value).replaceAll('|', '\\|').replaceAll('\n', '<br>');
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

function entryDisplayName(entry) {
	if (!entry) return '';
	return entry.displayName || entry.file;
}

function findEntryKey(manifest) {
	const entries = Object.entries(manifest);
	return entries.find(([key, chunk]) => key === 'src/_boot_.ts' || chunk.src === 'src/_boot_.ts')?.[0]
		?? entries.find(([, chunk]) => chunk.name === 'entry' && chunk.isEntry)?.[0]
		?? entries.find(([, chunk]) => chunk.isEntry)?.[0]
		?? null;
}

function stableChunkKey(manifestKey, chunk) {
	return chunk.src ?? (chunk.name ? `chunk:${chunk.name}` : manifestKey);
}

function collectStartupKeys(manifest) {
	const entryKey = findEntryKey(manifest);
	const keys = new Set();
	if (entryKey == null) return keys;

	function visit(key) {
		if (keys.has(key)) return;
		const chunk = manifest[key];
		if (!chunk || !chunk.file?.endsWith('.js')) return;
		keys.add(stableChunkKey(key, chunk));
		for (const importKey of chunk.imports ?? []) {
			visit(importKey);
		}
	}

	visit(entryKey);
	return keys;
}

async function resolveBuiltFile(outDir, file) {
	if (file.startsWith('scripts/')) {
		const localizedFile = file.slice('scripts/'.length);
		const localizedPath = path.join(outDir, locale, localizedFile);
		if (await exists(localizedPath)) {
			return {
				absolutePath: localizedPath,
				relativePath: `${locale}/${localizedFile}`,
			};
		}

		throw new Error(`Expected ${locale} localized chunk for ${file}, but ${localizedPath} was not found.`);
	}
	return {
		absolutePath: path.join(outDir, file),
		relativePath: file,
	};
}

async function collectReport(repoDir) {
	const outDir = path.join(repoDir, 'built/_frontend_vite_');
	const manifestPath = path.join(outDir, 'manifest.json');
	const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
	const byKey = new Map();
	const byFile = new Set();

	for (const [key, chunk] of Object.entries(manifest)) {
		if (!chunk.file?.endsWith('.js')) continue;
		const builtFile = await resolveBuiltFile(outDir, chunk.file);
		const size = await fileSize(builtFile.absolutePath);
		const stableKey = stableChunkKey(key, chunk);
		const displayName = chunk.src ?? chunk.name ?? key;
		byKey.set(stableKey, {
			key: stableKey,
			displayName,
			file: builtFile.relativePath,
			size,
		});
		byFile.add(builtFile.relativePath);
	}

	const localeDir = path.join(outDir, locale);
	if (await exists(localeDir)) {
		for await (const fullPath of walk(localeDir)) {
			if (!fullPath.endsWith('.js')) continue;
			const relativePath = normalizePath(path.relative(outDir, fullPath));
			if (byFile.has(relativePath)) continue;
			const size = await fileSize(fullPath);
			byKey.set(relativePath, {
				key: relativePath,
				displayName: relativePath,
				file: relativePath,
				size,
			});
		}
	}

	return {
		manifest,
		chunks: Object.fromEntries(byKey),
		startupKeys: [...collectStartupKeys(manifest)],
	};
}

function collectVisualizerReport(data) {
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

function renderVisualizerSummaryTable(before, after) {
	const summary = [
		'bundles',
		'modules',
		'entries',
		//'externals',
		'staticImports',
		'dynamicImports',
	];

	const metrics = [
		'renderedLength',
		'gzipLength',
		'brotliLength',
	];

	return [
		`<table>`,
		`<thead>`,
		`<tr>`,
		`<th rowspan="2"></th>`,
		`<th rowspan="2">Bundles</th>`,
		`<th rowspan="2">Modules</th>`,
		`<th rowspan="2">Entries</th>`,
		`<th colspan="2">Imports</th>`,
		`<th colspan="3">Size</th>`,
		`</tr>`,
		`<tr>`,
		`<th>Static</th>`,
		`<th>Dynamic</th>`,
		`<th>Rendered</th>`,
		`<th>Gzip</th>`,
		`<th>Brotli</th>`,
		`</tr>`,
		`</thead>`,
		`<tbody>`,
		`<tr>`,
		`<th><b>Before</b></th>`,
		...summary.map((key) => `<td>${formatNumber(before.summary[key])}</td>`),
		...metrics.map((key) => `<td>${formatBytes(before.metrics[key])}</td>`),
		`</tr>`,
		`<tr>`,
		`<th><b>After</b></th>`,
		...summary.map((key) => `<td>${formatNumber(after.summary[key])}</td>`),
		...metrics.map((key) => `<td>${formatBytes(after.metrics[key])}</td>`),
		`</tr>`,
		`<tr><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>`,
		`<tr>`,
		`<th><b>Δ</b></th>`,
		...summary.map((key) => `<td>${formatNumberDiff(before.summary[key], after.summary[key])}</td>`),
		...metrics.map((key) => `<td>${formatBytesDiff(before.metrics[key], after.metrics[key])}</td>`),
		`</tr>`,
		`<tr>`,
		`<th><b>Δ (%)</b></th>`,
		...summary.map((key) => `<td>${formatDiffPercent(before.summary[key], after.summary[key])}</td>`),
		...metrics.map((key) => `<td>${formatDiffPercent(before.metrics[key], after.metrics[key])}</td>`),
		`</tr>`,
		`</tbody>`,
		`</table>`,
	];
}

function getChunkComparisonRows(keys, before, after) {
	return keys.map((key) => {
		const beforeEntry = before.chunks[key];
		const afterEntry = after.chunks[key];
		const beforeSize = beforeEntry?.size ?? 0;
		const afterSize = afterEntry?.size ?? 0;
		return {
			key,
			name: entryDisplayName(beforeEntry ?? afterEntry),
			chunkFile: beforeEntry?.file ?? afterEntry?.file,
			beforeSize,
			afterSize,
			changeType: beforeEntry == null ? 'added' : afterEntry == null ? 'removed' : beforeSize !== afterSize ? 'updated' : 'unchanged',
			sortSize: Math.max(beforeSize, afterSize),
		};
	});
}

function summarizeChunkChanges(rows) {
	return {
		updated: rows.filter((row) => row.changeType === 'updated').length,
		added: rows.filter((row) => row.changeType === 'added').length,
		removed: rows.filter((row) => row.changeType === 'removed').length,
	};
}

function formatChunkChangeSummary(label, summary) {
	return `${label} (${summary.updated} updated, ${summary.added} added, ${summary.removed} removed)`;
}

function compareChunkComparisonRows(a, b) {
	return Math.abs(b.afterSize - b.beforeSize) - Math.abs(a.afterSize - a.beforeSize)
		|| (b.afterSize - b.beforeSize) - (a.afterSize - a.beforeSize)
		|| b.sortSize - a.sortSize
		|| a.name.localeCompare(b.name);
}

function chunkMarkdownTable(rows, total) {
	if (rows.length === 0) return '_No data_';

	const lines = [
		'| Chunk | Before | After | Δ | Δ (%) |',
		'| --- | ---: | ---: | ---: | ---: |',
	];
	if (total != null) {
		lines.push(`| (total) | ${formatBytes(total.beforeSize)} | ${formatBytes(total.afterSize)} | ${formatBytesDiff(total.beforeSize, total.afterSize)} | ${formatDiffPercent(total.beforeSize, total.afterSize).replaceAll('\\%', '\\\\%')} |`);
		lines.push('| | | | | |');
	}
	for (const row of rows) {
		if (row.changeType === 'added') {
			lines.push(`| <details><summary>\`${escapeCell(row.name)}\`</summary> \`${escapeCell(row.chunkFile)}\` </details> | ${formatBytes(row.beforeSize)} | ${formatBytes(row.afterSize)} | ${formatBytesDiff(row.beforeSize, row.afterSize)} | $\\color{orange}{\\text{(+)}}$ |`);
		} else if (row.changeType === 'removed') {
			lines.push(`| <details><summary>\`${escapeCell(row.name)}\`</summary> \`${escapeCell(row.chunkFile)}\` </details> | ${formatBytes(row.beforeSize)} | ${formatBytes(row.afterSize)} | ${formatBytesDiff(row.beforeSize, row.afterSize)} | $\\color{green}{\\text{(-)}}$ |`);
		} else {
			lines.push(`| <details><summary>\`${escapeCell(row.name)}\`</summary> \`${escapeCell(row.chunkFile)}\` </details> | ${formatBytes(row.beforeSize)} | ${formatBytes(row.afterSize)} | ${formatBytesDiff(row.beforeSize, row.afterSize)} | ${formatDiffPercent(row.beforeSize, row.afterSize).replaceAll('\\%', '\\\\%')} |`);
		}
	}
	return lines.join('\n');
}

function renderFrontendChunkReport(before, after) {
	const commonChunkKeys = Object.keys(before.chunks).filter((key) => after.chunks[key] != null);
	const addedChunkKeys = Object.keys(after.chunks).filter((key) => before.chunks[key] == null);
	const removedChunkKeys = Object.keys(before.chunks).filter((key) => after.chunks[key] == null);
	const allChunkKeys = [
		...commonChunkKeys,
		...addedChunkKeys,
		...removedChunkKeys,
	];
	//const comparisonRows = getChunkComparisonRows(commonChunkKeys, before, after);
	const allComparisonRows = getChunkComparisonRows(allChunkKeys, before, after);

	const changedRows = allComparisonRows.filter((row) => row.changeType !== 'unchanged');
	const diffSummary = summarizeChunkChanges(changedRows);
	const diffTotal = {
		beforeSize: allComparisonRows.reduce((sum, row) => sum + row.beforeSize, 0),
		afterSize: allComparisonRows.reduce((sum, row) => sum + row.afterSize, 0),
	};
	const diffRows = changedRows.sort(compareChunkComparisonRows).slice(0, 30); // TODO: 実際に30を超えて切り捨てられたrowがあった場合はその旨をmarkdown内に表示するようにする

	const startupKeys = new Set([
		...before.startupKeys,
		...after.startupKeys,
	]);
	const startupComparisonRows = getChunkComparisonRows([...startupKeys], before, after);
	const startupRows = startupComparisonRows.sort(compareChunkComparisonRows);
	const startupSummary = summarizeChunkChanges(startupComparisonRows);
	const startupTotal = {
		beforeSize: startupComparisonRows.reduce((sum, row) => sum + row.beforeSize, 0),
		afterSize: startupComparisonRows.reduce((sum, row) => sum + row.afterSize, 0),
	};

	//const largeRows = comparisonRows
	//	.sort((a, b) => b.sortSize - a.sortSize || a.name.localeCompare(b.name))
	//	.slice(0, 30);

	return [
		'<details open>',
		`<summary>${formatChunkChangeSummary('Chunk size diff', diffSummary)}</summary>`,
		'',
		chunkMarkdownTable(diffRows, diffTotal),
		'',
		'</details>',
		'',
		'<details>',
		`<summary>${formatChunkChangeSummary('Startup chunk size', startupSummary)}</summary>`,
		'',
		chunkMarkdownTable(startupRows, startupTotal),
		'',
		`_Startup chunks are the Vite entry for \`src/_boot_.ts\` and its static imports._`,
		'',
		'</details>',
		'',
		//'<details>',
		//`<summary>Largest</summary>`,
		//'',
		//markdownTable(largeRows),
		//'',
		//'</details>',
		//'',
	].join('\n');
}

function renderFrontendBundleReport(before, after) {
	const lines = [
		...renderVisualizerSummaryTable(before, after),
		'',
		//'<details>',
		//'<summary>Top 10</summary>',
		//'',
	];

	/*
	for (const row of after.hotModules.slice(0, 10)) {
		lines.push(`- ${code(row.id)}: ${sharePercent(row.renderedLength, after.metrics.renderedLength)} (${formatBytes(row.renderedLength)})`);
	}

	lines.push(
		'',
		'</details>',
	);

	lines.push(
		'',
		'<details>',
		'<summary>Hot Modules (Self Size)</summary>',
		'',
		'| Module | Bundles | Rendered | Share | Gzip | Brotli | Imports | Imported By |',
		'|---|---:|---:|---:|---:|---:|---:|---:|',
	);

	for (const row of after.hotModules.slice(0, 15)) {
		lines.push(`| ${tableCode(row.id)} | ${row.bundles} | ${formatBytes(row.renderedLength)} | ${sharePercent(row.renderedLength, after.metrics.renderedLength)} | ${formatBytes(row.gzipLength)} | ${formatBytes(row.brotliLength)} | ${row.importedCount} | ${row.importedByCount} |`);
	}

	lines.push(
		'',
		'</details>',
	);
	*/

	return lines.join('\n');
}

const visualizerTreemapLimit = 30;

function mermaidTreemapLabel(value) {
	const label = String(value)
		.replaceAll('\\', '/')
		.replaceAll('"', "'")
		.replaceAll('`', "'")
		.replaceAll('\r', ' ')
		.replaceAll('\n', ' ')
		.trim();
	return label === '' ? '(unknown)' : label;
}

function mermaidTreemapModuleLabel(id) {
	const normalizedId = String(id).replaceAll('\\', '/');
	const filePath = normalizedId.split(/[?#]/, 1)[0];
	const fileName = path.posix.basename(filePath);
	return mermaidTreemapLabel(fileName || normalizedId);
}

function renderVisualizerTreemap(label, report) {
	const rows = report.hotModules
		.filter((row) => row.renderedLength > 0)
		.slice(0, visualizerTreemapLimit);
	const topRendered = rows.reduce((sum, row) => sum + row.renderedLength, 0);
	const otherRendered = Math.max(0, report.metrics.renderedLength - topRendered);
	const lines = [
		'```mermaid',
		'treemap-beta',
		`"${mermaidTreemapLabel(label)}"`,
	];

	for (const row of rows) {
		lines.push(`  "${mermaidTreemapModuleLabel(row.id)}": ${Math.round(row.renderedLength)}`);
	}
	if (otherRendered > 0) {
		lines.push(`  "Other": ${Math.round(otherRendered)}`);
	}

	lines.push('```');
	return lines.join('\n');
}

function renderVisualizerTreemapDetails(label, report, open = false) {
	return [
		`<details${open ? ' open' : ''}>`,
		`<summary>${label} rendered size treemap (top ${visualizerTreemapLimit} + Other)</summary>`,
		'',
		renderVisualizerTreemap(label, report),
		'',
		'</details>',
	].join('\n');
}

const args = process.argv.slice(2);
const [beforeDir, afterDir, beforeStatsFile, afterStatsFile, outFile] = args;
const before = await collectReport(beforeDir);
const after = await collectReport(afterDir);
const beforeStats = JSON.parse(await fs.readFile(beforeStatsFile, 'utf8'));
const afterStats = JSON.parse(await fs.readFile(afterStatsFile, 'utf8'));
const beforeVisualizerReport = collectVisualizerReport(beforeStats);
const afterVisualizerReport = collectVisualizerReport(afterStats);
const visualizerArtifactLink = `[Download detailed HTML](${process.env.FRONTEND_BUNDLE_REPORT_ARTIFACT_URL})`;

const body = [
	marker,
	'',
	`## Frontend Bundle Report`,
	'',
	renderFrontendChunkReport(before, after),
	'',
	'## Bundle Stats',
	'',
	renderFrontendBundleReport(beforeVisualizerReport, afterVisualizerReport),
	'',
	renderVisualizerTreemapDetails('Before', beforeVisualizerReport),
	'',
	renderVisualizerTreemapDetails('After', afterVisualizerReport, true),
	'',
	visualizerArtifactLink,
].join('\n');

await fs.writeFile(outFile, body);
