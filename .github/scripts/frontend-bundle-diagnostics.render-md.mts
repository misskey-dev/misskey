/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import * as util from './utility.mts';

const locale = 'ja-JP';

type Manifest = Record<string, { file?: string; src?: string; name?: string; isEntry?: boolean; imports?: string[] }>;

const stableNamedChunks = new Set(['vue', 'i18n']);

type FileEntry = {
	comparisonKey: string | null;
	displayName: string;
	file: string;
	manifestKeys: string[];
	size: number;
};

type CollectedReport = {
	manifest: Manifest;
	chunks: FileEntry[];
	comparableChunks: Record<string, FileEntry>;
	chunksByManifestKey: Record<string, FileEntry>;
	startupFiles: string[];
};

function entryDisplayName(entry: FileEntry) {
	if (!entry) return '';
	return entry.displayName || entry.file;
}

function findEntryKey(manifest: Manifest) {
	const entries = Object.entries(manifest);
	return entries.find(([key, chunk]) => key === 'src/_boot_.ts' || chunk.src === 'src/_boot_.ts')?.[0]
		?? entries.find(([, chunk]) => chunk.name === 'entry' && chunk.isEntry)?.[0]
		?? entries.find(([, chunk]) => chunk.isEntry)?.[0]
		?? null;
}

function stableChunkKey(chunk: Manifest[string]) {
	if (chunk.src != null) return `src:${util.normalizePath(chunk.src)}`;
	if (chunk.name != null && stableNamedChunks.has(chunk.name)) return `named:${chunk.name}`;
	return null;
}

function collectStartupManifestKeys(manifest: Manifest) {
	const entryKey = findEntryKey(manifest);
	const keys = new Set<string>();
	if (entryKey == null) throw new Error('Unable to find frontend startup entry in Vite manifest.');

	function visit(key: string, importedBy?: string) {
		if (keys.has(key)) return;
		const chunk = manifest[key];
		const importContext = importedBy == null ? '' : ` imported by "${importedBy}"`;
		if (chunk == null) throw new Error(`Startup manifest key "${key}"${importContext} is missing.`);
		if (chunk.file == null || chunk.file.length === 0) throw new Error(`Startup manifest key "${key}"${importContext} has no output file.`);
		if (!chunk.file.endsWith('.js')) throw new Error(`Startup manifest key "${key}"${importContext} resolves to non-JavaScript output "${chunk.file}".`);
		keys.add(key);
		for (const importKey of chunk.imports ?? []) visit(importKey, key);
	}

	visit(entryKey);
	return keys;
}

async function resolveBuiltFile(outDir: string, file: string) {
	if (file.startsWith('scripts/')) {
		const localizedFile = file.slice('scripts/'.length);
		const localizedPath = path.join(outDir, locale, localizedFile);
		if (await util.fileExists(localizedPath)) {
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

async function collectReport(repoDir: string): Promise<CollectedReport> {
	const outDir = path.join(repoDir, 'built/_frontend_vite_');
	const manifestPath = path.join(outDir, 'manifest.json');
	const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8')) as Manifest;
	const chunksByFile = new Map<string, FileEntry>();
	const comparableChunks = new Map<string, FileEntry>();
	const chunksByManifestKey = new Map<string, FileEntry>();

	for (const [manifestKey, chunk] of Object.entries(manifest)) {
		if (!chunk.file?.endsWith('.js')) continue;
		const builtFile = await resolveBuiltFile(outDir, chunk.file);
		const comparisonKey = stableChunkKey(chunk);
		let entry = chunksByFile.get(builtFile.relativePath);
		if (entry == null) {
			entry = {
				comparisonKey,
				displayName: chunk.src ?? chunk.name ?? manifestKey,
				file: builtFile.relativePath,
				manifestKeys: [manifestKey],
				size: await util.fileSize(builtFile.absolutePath),
			};
			chunksByFile.set(entry.file, entry);
		} else if (entry.comparisonKey !== comparisonKey) {
			throw new Error(`Conflicting identities for ${entry.file}`);
		} else {
			entry.manifestKeys.push(manifestKey);
		}
		chunksByManifestKey.set(manifestKey, entry);
		if (comparisonKey != null) {
			const existing = comparableChunks.get(comparisonKey);
			if (existing != null && existing.file !== entry.file) {
				throw new Error(`Duplicate stable chunk key "${comparisonKey}": ${existing.file}, ${entry.file}`);
			}
			comparableChunks.set(comparisonKey, entry);
		}
	}

	const localeDir = path.join(outDir, locale);
	if (await util.fileExists(localeDir)) {
		for await (const fullPath of util.traverseDirectory(localeDir)) {
			if (!fullPath.endsWith('.js')) continue;
			const relativePath = util.normalizePath(path.relative(outDir, fullPath));
			if (chunksByFile.has(relativePath)) continue;
			chunksByFile.set(relativePath, {
				comparisonKey: null,
				displayName: relativePath,
				file: relativePath,
				manifestKeys: [],
				size: await util.fileSize(fullPath),
			});
		}
	}

	const startupFiles = new Set<string>();
	for (const manifestKey of collectStartupManifestKeys(manifest)) {
		const entry = chunksByManifestKey.get(manifestKey);
		if (entry != null) startupFiles.add(entry.file);
	}

	return {
		manifest,
		chunks: [...chunksByFile.values()],
		comparableChunks: Object.fromEntries(comparableChunks),
		chunksByManifestKey: Object.fromEntries(chunksByManifestKey),
		startupFiles: [...startupFiles],
	};
}

type VisualizerReport = {
	nodeParts?: Record<string, {
		renderedLength: number;
		gzipLength: number;
		brotliLength: number;
	}>;
	nodeMetas?: Record<string, {
		id: string;
		isEntry?: boolean;
		isExternal?: boolean;
		importedBy?: string[];
		imported?: { id: string; dynamic?: boolean }[];
		moduleParts?: Record<string, string>;
		renderedLength: number;
		gzipLength: number;
		brotliLength: number;
	}>;
	options?: Record<string, unknown>;
};


function collectVisualizerReport(data: VisualizerReport) {
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

function renderVisualizerSummaryTable(before: ReturnType<typeof collectVisualizerReport>, after: ReturnType<typeof collectVisualizerReport>) {
	const summary = [
		'bundles',
		'modules',
		'entries',
		//'externals',
		'staticImports',
		'dynamicImports',
	] as const;

	const metrics = [
		'renderedLength',
		'gzipLength',
		'brotliLength',
	] as const;

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
		...summary.map((key) => `<td>${util.formatNumber(before.summary[key])}</td>`),
		...metrics.map((key) => `<td>${util.formatBytes(before.metrics[key])}</td>`),
		`</tr>`,
		`<tr>`,
		`<th><b>After</b></th>`,
		...summary.map((key) => `<td>${util.formatNumber(after.summary[key])}</td>`),
		...metrics.map((key) => `<td>${util.formatBytes(after.metrics[key])}</td>`),
		`</tr>`,
		`<tr><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>`,
		`<tr>`,
		`<th><b>Δ</b></th>`,
		...summary.map((key) => `<td>${util.calcAndFormatDeltaNumber(before.summary[key], after.summary[key], 0)}</td>`),
		...metrics.map((key) => `<td>${util.calcAndFormatDeltaBytes(before.metrics[key], after.metrics[key], 1000)}</td>`),
		`</tr>`,
		`<tr>`,
		`<th><b>Δ (%)</b></th>`,
		...summary.map((key) => `<td>${util.calcAndFormatDeltaPercent(before.summary[key], after.summary[key], 0.1)}</td>`),
		...metrics.map((key) => `<td>${util.calcAndFormatDeltaPercent(before.metrics[key], after.metrics[key], 0.1)}</td>`),
		`</tr>`,
		`</tbody>`,
		`</table>`,
	].join('\n');
}

function getChunkComparisonRows(keys: string[], before: Record<string, FileEntry>, after: Record<string, FileEntry>) {
	return keys.map(key => {
		const beforeEntry = before[key];
		const afterEntry = after[key];
		const beforeSize = beforeEntry?.size ?? 0;
		const afterSize = afterEntry?.size ?? 0;
		return {
			key,
			name: entryDisplayName(beforeEntry ?? afterEntry),
			beforeFile: beforeEntry?.file,
			afterFile: afterEntry?.file,
			beforeSize,
			afterSize,
			changeType: beforeEntry == null ? 'added' : afterEntry == null ? 'removed' : beforeSize !== afterSize ? 'updated' : 'unchanged',
			sortSize: Math.max(beforeSize, afterSize),
		};
	});
}

type ChunkComparisonRow = ReturnType<typeof getChunkComparisonRows>[number];

type ChunkAggregate = {
	beforeSize: number;
	afterSize: number;
	beforeCount: number;
	afterCount: number;
};

const smallDeltaThreshold = 5;

function sumChunkSizes(chunks: FileEntry[]) {
	return chunks.reduce((sum, chunk) => sum + chunk.size, 0);
}

function generatedAggregate(before: FileEntry[], after: FileEntry[]): ChunkAggregate {
	const beforeGenerated = before.filter(chunk => chunk.comparisonKey == null);
	const afterGenerated = after.filter(chunk => chunk.comparisonKey == null);
	return {
		beforeSize: sumChunkSizes(beforeGenerated),
		afterSize: sumChunkSizes(afterGenerated),
		beforeCount: beforeGenerated.length,
		afterCount: afterGenerated.length,
	};
}

function hasSmallDelta(row: ChunkComparisonRow) {
	return Math.abs(row.afterSize - row.beforeSize) <= smallDeltaThreshold;
}

function comparisonRowsAggregate(rows: ChunkComparisonRow[]): ChunkAggregate {
	return {
		beforeSize: rows.reduce((sum, row) => sum + row.beforeSize, 0),
		afterSize: rows.reduce((sum, row) => sum + row.afterSize, 0),
		beforeCount: rows.filter(row => row.beforeFile != null).length,
		afterCount: rows.filter(row => row.afterFile != null).length,
	};
}

function comparableMap(chunks: FileEntry[]) {
	const entries: [string, FileEntry][] = [];
	for (const chunk of chunks) {
		if (chunk.comparisonKey != null) entries.push([chunk.comparisonKey, chunk]);
	}
	return Object.fromEntries(entries);
}

function summarizeChunkChanges(rows: ReturnType<typeof getChunkComparisonRows>) {
	return {
		updated: rows.filter((row) => row.changeType === 'updated').length,
		added: rows.filter((row) => row.changeType === 'added').length,
		removed: rows.filter((row) => row.changeType === 'removed').length,
	};
}

function formatChunkChangeSummary(label: string, summary: ReturnType<typeof summarizeChunkChanges>) {
	return `${label} (${summary.updated} updated, ${summary.added} added, ${summary.removed} removed)`;
}

function compareChunkComparisonRows(a: ChunkComparisonRow, b: ChunkComparisonRow) {
	return Math.abs(b.afterSize - b.beforeSize) - Math.abs(a.afterSize - a.beforeSize)
		|| (b.afterSize - b.beforeSize) - (a.afterSize - a.beforeSize)
		|| b.sortSize - a.sortSize
		|| a.name.localeCompare(b.name);
}

function chunkFileDisplay(row: ChunkComparisonRow) {
	if (row.beforeFile == null) return row.afterFile ?? '';
	if (row.afterFile == null || row.beforeFile === row.afterFile) return row.beforeFile;
	return `${row.beforeFile} → ${row.afterFile}`;
}

function chunkMarkdownTable(
	rows: ReturnType<typeof getChunkComparisonRows>,
	total?: { beforeSize: number; afterSize: number },
	generated?: ChunkAggregate,
	other?: ChunkAggregate,
) {
	const hasGenerated = generated != null && (generated.beforeCount > 0 || generated.afterCount > 0);
	const hasOther = other != null && (other.beforeCount > 0 || other.afterCount > 0);
	if (rows.length === 0 && total == null && !hasGenerated && !hasOther) return '_No data_';

	const lines = [
		'| Chunk | Before | After | Δ | Δ (%) |',
		'| --- | ---: | ---: | ---: | ---: |',
	];
	if (total != null) {
		lines.push(`| (total) | ${util.formatBytes(total.beforeSize)} | ${util.formatBytes(total.afterSize)} | ${util.calcAndFormatDeltaBytes(total.beforeSize, total.afterSize, 1000)} | ${util.calcAndFormatDeltaPercent(total.beforeSize, total.afterSize, 0.1).replaceAll('\\%', '\\\\%')} |`);
		lines.push('| | | | | |');
	}

	for (const row of rows) {
		const chunkFile = chunkFileDisplay(row);
		if (row.changeType === 'added') {
			lines.push(`| <details><summary>\`${util.escapeMdTableCell(row.name)}\`</summary> \`${util.escapeMdTableCell(chunkFile)}\` </details> | ${util.formatBytes(row.beforeSize)} | ${util.formatBytes(row.afterSize)} | ${util.calcAndFormatDeltaBytes(row.beforeSize, row.afterSize, 1000)} | $\\color{orange}{\\text{( + )}}$ |`);
		} else if (row.changeType === 'removed') {
			lines.push(`| <details><summary>\`${util.escapeMdTableCell(row.name)}\`</summary> \`${util.escapeMdTableCell(chunkFile)}\` </details> | ${util.formatBytes(row.beforeSize)} | ${util.formatBytes(row.afterSize)} | ${util.calcAndFormatDeltaBytes(row.beforeSize, row.afterSize, 1000)} | $\\color{green}{\\text{( - )}}$ |`);
		} else {
			lines.push(`| <details><summary>\`${util.escapeMdTableCell(row.name)}\`</summary> \`${util.escapeMdTableCell(chunkFile)}\` </details> | ${util.formatBytes(row.beforeSize)} | ${util.formatBytes(row.afterSize)} | ${util.calcAndFormatDeltaBytes(row.beforeSize, row.afterSize, 1000)} | ${util.calcAndFormatDeltaPercent(row.beforeSize, row.afterSize, 0.1).replaceAll('\\%', '\\\\%')} |`);
		}
	}
	if (hasGenerated) {
		lines.push(`| (other generated chunks) | ${util.formatBytes(generated.beforeSize)} | ${util.formatBytes(generated.afterSize)} | ${util.calcAndFormatDeltaBytes(generated.beforeSize, generated.afterSize, 1000)} | ${util.calcAndFormatDeltaPercent(generated.beforeSize, generated.afterSize, 0.1).replaceAll('\\%', '\\\\%')} |`);
	}
	if (hasOther) {
		lines.push(`| (other) | ${util.formatBytes(other.beforeSize)} | ${util.formatBytes(other.afterSize)} | ${util.calcAndFormatDeltaBytes(other.beforeSize, other.afterSize, 1000)} | ${util.calcAndFormatDeltaPercent(other.beforeSize, other.afterSize, 0.1).replaceAll('\\%', '\\\\%')} |`);
	}
	return lines.join('\n');
}

function renderFrontendChunkReport(before: Awaited<ReturnType<typeof collectReport>>, after: Awaited<ReturnType<typeof collectReport>>) {
	const beforeComparable = before.comparableChunks;
	const afterComparable = after.comparableChunks;
	const allChunkKeys = [...new Set([...Object.keys(beforeComparable), ...Object.keys(afterComparable)])];
	const allComparisonRows = getChunkComparisonRows(allChunkKeys, beforeComparable, afterComparable);

	const changedRows = allComparisonRows.filter((row) => row.changeType !== 'unchanged');
	const diffSummary = summarizeChunkChanges(changedRows);
	const diffTotal = {
		beforeSize: sumChunkSizes(before.chunks),
		afterSize: sumChunkSizes(after.chunks),
	};
	const diffGenerated = generatedAggregate(before.chunks, after.chunks);
	const diffOther = comparisonRowsAggregate(changedRows.filter(hasSmallDelta));
	const diffRows = changedRows.filter(row => !hasSmallDelta(row)).sort(compareChunkComparisonRows).slice(0, 30); // TODO: 実際に30を超えて切り捨てられたrowがあった場合はその旨をmarkdown内に表示するようにする

	const beforeStartupFiles = new Set(before.startupFiles);
	const afterStartupFiles = new Set(after.startupFiles);
	const beforeStartupChunks = before.chunks.filter(chunk => beforeStartupFiles.has(chunk.file));
	const afterStartupChunks = after.chunks.filter(chunk => afterStartupFiles.has(chunk.file));
	const beforeStartupComparable = comparableMap(beforeStartupChunks);
	const afterStartupComparable = comparableMap(afterStartupChunks);
	const startupKeys = [...new Set([...Object.keys(beforeStartupComparable), ...Object.keys(afterStartupComparable)])];
	const startupComparisonRows = getChunkComparisonRows(startupKeys, beforeStartupComparable, afterStartupComparable);
	const startupSummary = summarizeChunkChanges(startupComparisonRows);
	const startupOther = comparisonRowsAggregate(startupComparisonRows.filter(hasSmallDelta));
	const startupRows = startupComparisonRows.filter(row => !hasSmallDelta(row)).sort(compareChunkComparisonRows);
	const startupTotal = {
		beforeSize: sumChunkSizes(beforeStartupChunks),
		afterSize: sumChunkSizes(afterStartupChunks),
	};
	const startupGenerated = generatedAggregate(beforeStartupChunks, afterStartupChunks);

	return [
		'<details>',
		`<summary>${formatChunkChangeSummary('Chunk size diff', diffSummary)}</summary>`,
		'',
		chunkMarkdownTable(diffRows, diffTotal, diffGenerated, diffOther),
		'',
		'</details>',
		'',
		'<details>',
		`<summary>${formatChunkChangeSummary('Startup chunk size', startupSummary)}</summary>`,
		'',
		chunkMarkdownTable(startupRows, startupTotal, startupGenerated, startupOther),
		'',
		`_Startup chunks are the Vite entry for \`src/_boot_.ts\` and its static imports._`,
		'',
		'</details>',
		'',
	].join('\n');
}

const args = process.argv.slice(2);
const [beforeDir, afterDir, beforeStatsFile, afterStatsFile, outFile] = args;
const before = await collectReport(beforeDir);
const after = await collectReport(afterDir);
const beforeStats = JSON.parse(await fs.readFile(beforeStatsFile, 'utf8')) as VisualizerReport;
const afterStats = JSON.parse(await fs.readFile(afterStatsFile, 'utf8')) as VisualizerReport;
const beforeVisualizerReport = collectVisualizerReport(beforeStats);
const afterVisualizerReport = collectVisualizerReport(afterStats);
const visualizerArtifactLink = `[Open treemap HTML](${process.env.FRONTEND_BUNDLE_REPORT_ARTIFACT_URL})`;

const body = [
	`## 📦 Frontend Bundle Report`,
	'',
	renderFrontendChunkReport(before, after),
	'',
	'## Bundle Stats',
	'',
	renderVisualizerSummaryTable(beforeVisualizerReport, afterVisualizerReport),
	'',
	visualizerArtifactLink,
].join('\n');

await fs.writeFile(outFile, body);
