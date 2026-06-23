import { promises as fs } from 'node:fs';
import path from 'node:path';

const marker = '<!-- misskey-frontend-js-size -->';
const locale = process.env.FRONTEND_JS_SIZE_LOCALE || 'ja-JP';

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

function formatBytes(size) {
	if (size == null) return '-';
	if (size < 1024) return `${size} B`;
	if (size < 1024 * 1024) return `${stripTrailingZeros((size / 1024).toFixed(1))} KiB`;
	return `${stripTrailingZeros((size / 1024 / 1024).toFixed(2))} MiB`;
}

function stripTrailingZeros(value) {
	return value.replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1');
}

function formatMathText(text) {
	return text
		.replaceAll('\\', '\\\\')
		.replaceAll('{', '\\{')
		.replaceAll('}', '\\}')
		.replaceAll('%', '\\%');
}

function formatDiff(diff) {
	if (diff == null) return '-';
	if (diff === 0) return '0 B';
	const sign = diff > 0 ? '+' : '-';
	const text = `${sign}${formatBytes(Math.abs(diff))}`;
	const color = diff > 0 ? 'orange' : 'green';
	return `$\\color{${color}}{\\text{${formatMathText(text).replaceAll('\\%', '\\\\%')}}}$`;
}

function formatDiffPercent(beforeSize, afterSize) {
	if (beforeSize == null || beforeSize === 0 || afterSize == null || afterSize === 0) return '-';
	const diff = afterSize - beforeSize;
	if (diff === 0) return `0%`;
	const percent = Math.round(diff / beforeSize * 100);
	const color = diff > 0 ? 'orange' : 'green';
	return `$\\color{${color}}{\\text{${formatMathText(percent.toString() + '%').replaceAll('\\%', '\\\\%')}}}$`;
}

function escapeCell(value) {
	return String(value).replaceAll('|', '\\|').replaceAll('\n', '<br>');
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

function commonKeys(before, after) {
	return Object.keys(before.chunks)
		.filter((key) => after.chunks[key] != null);
}

function addedKeys(before, after) {
	return Object.keys(after.chunks)
		.filter((key) => before.chunks[key] == null);
}

function removedKeys(before, after) {
	return Object.keys(before.chunks)
		.filter((key) => after.chunks[key] == null);
}

function rowChangeType(beforeEntry, afterEntry, beforeSize, afterSize) {
	if (beforeEntry == null) return 'added';
	if (afterEntry == null) return 'removed';
	if (beforeSize !== afterSize) return 'updated';
	return 'unchanged';
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
			changeType: rowChangeType(beforeEntry, afterEntry, beforeSize, afterSize),
			sortSize: Math.max(beforeSize, afterSize),
		};
	});
}

function summarizeChanges(rows) {
	return {
		updated: rows.filter((row) => row.changeType === 'updated').length,
		added: rows.filter((row) => row.changeType === 'added').length,
		removed: rows.filter((row) => row.changeType === 'removed').length,
	};
}

function formatChangeSummary(label, summary) {
	return `${label} (${summary.updated} updated, ${summary.added} added, ${summary.removed} removed)`;
}

function compareComparisonRows(a, b) {
	return Math.abs(b.afterSize - b.beforeSize) - Math.abs(a.afterSize - a.beforeSize)
		|| (b.afterSize - b.beforeSize) - (a.afterSize - a.beforeSize)
		|| b.sortSize - a.sortSize
		|| a.name.localeCompare(b.name);
}

function markdownTable(rows, total) {
	if (rows.length === 0) return '_No data_';

	const lines = [
		'| Chunk | Before | After | Δ | Δ (%) |',
		'| --- | ---: | ---: | ---: | ---: |',
	];
	if (total != null) {
		lines.push(`| (total) | ${formatBytes(total.beforeSize)} | ${formatBytes(total.afterSize)} | ${formatDiff(total.afterSize - total.beforeSize)} | ${formatDiffPercent(total.beforeSize, total.afterSize)} |`);
		lines.push('| | | | | |');
	}
	for (const row of rows) {
		if (row.changeType === 'added') {
			lines.push(`| <details><summary>\`${escapeCell(row.name)}\`</summary> \`${escapeCell(row.chunkFile)}\` </details> | ${formatBytes(row.beforeSize)} | ${formatBytes(row.afterSize)} | ${formatDiff(row.afterSize - row.beforeSize)} | $\\color{orange}{\\text{(+)}}$ |`);
		} else if (row.changeType === 'removed') {
			lines.push(`| <details><summary>\`${escapeCell(row.name)}\`</summary> \`${escapeCell(row.chunkFile)}\` </details> | ${formatBytes(row.beforeSize)} | ${formatBytes(row.afterSize)} | ${formatDiff(row.afterSize - row.beforeSize)} | $\\color{green}{\\text{(-)}}$ |`);
		} else {
			lines.push(`| <details><summary>\`${escapeCell(row.name)}\`</summary> \`${escapeCell(row.chunkFile)}\` </details> | ${formatBytes(row.beforeSize)} | ${formatBytes(row.afterSize)} | ${formatDiff(row.afterSize - row.beforeSize)} | ${formatDiffPercent(row.beforeSize, row.afterSize)} |`);
		}
	}
	return lines.join('\n');
}

const beforeDir = process.argv[2];
const afterDir = process.argv[3];
const outFile = process.argv[4];
const beforeSha = process.env.BASE_SHA;
const afterSha = process.env.HEAD_SHA;

const before = await collectReport(beforeDir);
const after = await collectReport(afterDir);

const commonChunkKeys = commonKeys(before, after);
const allChunkKeys = [
	...commonChunkKeys,
	...addedKeys(before, after),
	...removedKeys(before, after),
];
//const comparisonRows = getChunkComparisonRows(commonChunkKeys, before, after);
const allComparisonRows = getChunkComparisonRows(allChunkKeys, before, after);

const changedRows = allComparisonRows.filter((row) => row.changeType !== 'unchanged');
const diffSummary = summarizeChanges(changedRows);
const diffTotal = {
	beforeSize: allComparisonRows.reduce((sum, row) => sum + row.beforeSize, 0),
	afterSize: allComparisonRows.reduce((sum, row) => sum + row.afterSize, 0),
};
const diffRows = changedRows.sort(compareComparisonRows).slice(0, 30); // TODO: 実際に30を超えて切り捨てられたrowがあった場合はその旨をmarkdown内に表示するようにする

const startupKeys = new Set([
	...before.startupKeys,
	...after.startupKeys,
]);
const startupComparisonRows = getChunkComparisonRows([...startupKeys], before, after);
const startupRows = startupComparisonRows
	.sort(compareComparisonRows);
const startupSummary = summarizeChanges(startupComparisonRows);
const startupTotal = {
	beforeSize: startupComparisonRows.reduce((sum, row) => sum + row.beforeSize, 0),
	afterSize: startupComparisonRows.reduce((sum, row) => sum + row.afterSize, 0),
};

//const largeRows = comparisonRows
//	.sort((a, b) => b.sortSize - a.sortSize || a.name.localeCompare(b.name))
//	.slice(0, 30);

const body = [
	marker,
	`## Frontend Chunk Report`,
	'',
	'<details open>',
	`<summary>${formatChangeSummary('Diffs', diffSummary)}</summary>`,
	'',
	markdownTable(diffRows, diffTotal),
	'',
	'</details>',
	'',
	'<details>',
	`<summary>${formatChangeSummary('Startup', startupSummary)}</summary>`,
	'',
	markdownTable(startupRows, startupTotal),
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

await fs.writeFile(outFile, body);
