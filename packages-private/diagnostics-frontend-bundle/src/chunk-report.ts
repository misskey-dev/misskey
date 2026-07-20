/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import {
	calcAndFormatDeltaBytes,
	calcAndFormatDeltaPercentInMdTable,
	escapeMdTableCell,
	formatBytes,
} from 'diagnostics-shared/format';
import type { CollectedReport, FileEntry } from './manifest';

/**
 * この差分以下のチャンクは個別に出さず `(other)` にまとめる。
 * ハッシュ文字列の揺れ等でサイズが数バイト動くだけの行がノイズになるため。
 */
const smallDeltaThreshold = 5;

/** diff表に個別行として出す上限。これを超えた分は `(other)` に集約する */
const diffRowLimit = 30;

function entryDisplayName(entry: FileEntry | undefined) {
	if (entry == null) return '';
	return entry.displayName || entry.file;
}

export function getChunkComparisonRows(keys: string[], before: Partial<Record<string, FileEntry>>, after: Partial<Record<string, FileEntry>>) {
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

export type ChunkComparisonRow = ReturnType<typeof getChunkComparisonRows>[number];

export type ChunkAggregate = {
	beforeSize: number;
	afterSize: number;
	beforeCount: number;
	afterCount: number;
};

export function sumChunkSizes(chunks: FileEntry[]) {
	return chunks.reduce((sum, chunk) => sum + chunk.size, 0);
}

/**
 * 比較キーを持たない (= before/after で対応付けできない) チャンクの合計。
 */
export function generatedAggregate(before: FileEntry[], after: FileEntry[]): ChunkAggregate {
	const beforeGenerated = before.filter(chunk => chunk.comparisonKey == null);
	const afterGenerated = after.filter(chunk => chunk.comparisonKey == null);
	return {
		beforeSize: sumChunkSizes(beforeGenerated),
		afterSize: sumChunkSizes(afterGenerated),
		beforeCount: beforeGenerated.length,
		afterCount: afterGenerated.length,
	};
}

export function hasSmallDelta(row: ChunkComparisonRow) {
	return Math.abs(row.afterSize - row.beforeSize) <= smallDeltaThreshold;
}

export function comparisonRowsAggregate(rows: ChunkComparisonRow[]): ChunkAggregate {
	return {
		beforeSize: rows.reduce((sum, row) => sum + row.beforeSize, 0),
		afterSize: rows.reduce((sum, row) => sum + row.afterSize, 0),
		beforeCount: rows.filter(row => row.beforeFile != null).length,
		afterCount: rows.filter(row => row.afterFile != null).length,
	};
}

export function comparableMap(chunks: FileEntry[]) {
	const entries: [string, FileEntry][] = [];
	for (const chunk of chunks) {
		if (chunk.comparisonKey != null) entries.push([chunk.comparisonKey, chunk]);
	}
	return Object.fromEntries(entries);
}

export function summarizeChunkChanges(rows: ChunkComparisonRow[]) {
	return {
		updated: rows.filter((row) => row.changeType === 'updated').length,
		added: rows.filter((row) => row.changeType === 'added').length,
		removed: rows.filter((row) => row.changeType === 'removed').length,
	};
}

export function formatChunkChangeSummary(label: string, summary: ReturnType<typeof summarizeChunkChanges>) {
	return `${label} (${summary.updated} updated, ${summary.added} added, ${summary.removed} removed)`;
}

/**
 * 差分の絶対値が大きい順。同着は増加側・元サイズ・名前の順で決定的に並べる。
 */
export function compareChunkComparisonRows(a: ChunkComparisonRow, b: ChunkComparisonRow) {
	return Math.abs(b.afterSize - b.beforeSize) - Math.abs(a.afterSize - a.beforeSize)
		|| (b.afterSize - b.beforeSize) - (a.afterSize - a.beforeSize)
		|| b.sortSize - a.sortSize
		|| a.name.localeCompare(b.name);
}

export function chunkFileDisplay(row: ChunkComparisonRow) {
	if (row.beforeFile == null) return row.afterFile ?? '';
	if (row.afterFile == null || row.beforeFile === row.afterFile) return row.beforeFile;
	return `${row.beforeFile} → ${row.afterFile}`;
}

export function chunkMarkdownTable(
	rows: ChunkComparisonRow[],
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
		lines.push(`| (total) | ${formatBytes(total.beforeSize)} | ${formatBytes(total.afterSize)} | ${calcAndFormatDeltaBytes(total.beforeSize, total.afterSize, 1000)} | ${calcAndFormatDeltaPercentInMdTable(total.beforeSize, total.afterSize, 0.1)} |`);
		lines.push('| | | | | |');
	}

	for (const row of rows) {
		const chunkFile = chunkFileDisplay(row);
		if (row.changeType === 'added') {
			lines.push(`| <details><summary>\`${escapeMdTableCell(row.name)}\`</summary> \`${escapeMdTableCell(chunkFile)}\` </details> | ${formatBytes(row.beforeSize)} | ${formatBytes(row.afterSize)} | ${calcAndFormatDeltaBytes(row.beforeSize, row.afterSize, 1000)} | $\\color{orange}{\\text{( + )}}$ |`);
		} else if (row.changeType === 'removed') {
			lines.push(`| <details><summary>\`${escapeMdTableCell(row.name)}\`</summary> \`${escapeMdTableCell(chunkFile)}\` </details> | ${formatBytes(row.beforeSize)} | ${formatBytes(row.afterSize)} | ${calcAndFormatDeltaBytes(row.beforeSize, row.afterSize, 1000)} | $\\color{green}{\\text{( - )}}$ |`);
		} else {
			lines.push(`| <details><summary>\`${escapeMdTableCell(row.name)}\`</summary> \`${escapeMdTableCell(chunkFile)}\` </details> | ${formatBytes(row.beforeSize)} | ${formatBytes(row.afterSize)} | ${calcAndFormatDeltaBytes(row.beforeSize, row.afterSize, 1000)} | ${calcAndFormatDeltaPercentInMdTable(row.beforeSize, row.afterSize, 0.1)} |`);
		}
	}
	if (hasGenerated) {
		lines.push(`| (other generated chunks) | ${formatBytes(generated.beforeSize)} | ${formatBytes(generated.afterSize)} | ${calcAndFormatDeltaBytes(generated.beforeSize, generated.afterSize, 1000)} | ${calcAndFormatDeltaPercentInMdTable(generated.beforeSize, generated.afterSize, 0.1)} |`);
	}
	if (hasOther) {
		lines.push(`| (other) | ${formatBytes(other.beforeSize)} | ${formatBytes(other.afterSize)} | ${calcAndFormatDeltaBytes(other.beforeSize, other.afterSize, 1000)} | ${calcAndFormatDeltaPercentInMdTable(other.beforeSize, other.afterSize, 0.1)} |`);
	}
	return lines.join('\n');
}

export function renderFrontendChunkReport(before: CollectedReport, after: CollectedReport) {
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
	const largeDeltaRows = changedRows.filter(row => !hasSmallDelta(row)).sort(compareChunkComparisonRows);
	const diffRows = largeDeltaRows.slice(0, diffRowLimit);
	// 表示上限で切り捨てた行も `(other)` に含める。落とすと合計が実際の変化量と合わなくなる
	const diffOther = comparisonRowsAggregate([
		...changedRows.filter(hasSmallDelta),
		...largeDeltaRows.slice(diffRowLimit),
	]);

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
		'_Startup chunks are the Vite entry for \`src/_boot_.ts\` and its static imports._',
		'',
		'</details>',
		'',
	].join('\n');
}
