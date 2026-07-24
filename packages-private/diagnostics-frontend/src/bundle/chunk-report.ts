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
import type { CollectedBundleReport, FileEntry } from './manifest';

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

export function getChunkComparisonRows(keys: string[], base: Partial<Record<string, FileEntry>>, head: Partial<Record<string, FileEntry>>) {
	return keys.map(key => {
		const baseEntry = base[key];
		const headEntry = head[key];
		const baseSize = baseEntry?.size ?? 0;
		const headSize = headEntry?.size ?? 0;
		return {
			key,
			name: entryDisplayName(baseEntry ?? headEntry),
			baseFile: baseEntry?.file,
			headFile: headEntry?.file,
			baseSize,
			headSize,
			changeType: baseEntry == null ? 'added' : headEntry == null ? 'removed' : baseSize !== headSize ? 'updated' : 'unchanged',
			sortSize: Math.max(baseSize, headSize),
		};
	});
}

export type ChunkComparisonRow = ReturnType<typeof getChunkComparisonRows>[number];

export type ChunkAggregate = {
	baseSize: number;
	headSize: number;
	baseCount: number;
	headCount: number;
};

export function sumChunkSizes(chunks: FileEntry[]) {
	return chunks.reduce((sum, chunk) => sum + chunk.size, 0);
}

/**
 * 比較キーを持たない (= base/head で対応付けできない) チャンクの合計。
 */
export function generatedAggregate(base: FileEntry[], head: FileEntry[]): ChunkAggregate {
	const baseGenerated = base.filter(chunk => chunk.comparisonKey == null);
	const headGenerated = head.filter(chunk => chunk.comparisonKey == null);
	return {
		baseSize: sumChunkSizes(baseGenerated),
		headSize: sumChunkSizes(headGenerated),
		baseCount: baseGenerated.length,
		headCount: headGenerated.length,
	};
}

export function hasSmallDelta(row: ChunkComparisonRow) {
	return Math.abs(row.headSize - row.baseSize) <= smallDeltaThreshold;
}

export function comparisonRowsAggregate(rows: ChunkComparisonRow[]): ChunkAggregate {
	return {
		baseSize: rows.reduce((sum, row) => sum + row.baseSize, 0),
		headSize: rows.reduce((sum, row) => sum + row.headSize, 0),
		baseCount: rows.filter(row => row.baseFile != null).length,
		headCount: rows.filter(row => row.headFile != null).length,
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
	return Math.abs(b.headSize - b.baseSize) - Math.abs(a.headSize - a.baseSize)
		|| (b.headSize - b.baseSize) - (a.headSize - a.baseSize)
		|| b.sortSize - a.sortSize
		|| a.name.localeCompare(b.name);
}

export function chunkFileDisplay(row: ChunkComparisonRow) {
	if (row.baseFile == null) return row.headFile ?? '';
	if (row.headFile == null || row.baseFile === row.headFile) return row.baseFile;
	return `${row.baseFile} → ${row.headFile}`;
}

export function chunkMarkdownTable(
	rows: ChunkComparisonRow[],
	total?: { baseSize: number; headSize: number },
	generated?: ChunkAggregate,
	other?: ChunkAggregate,
) {
	const hasGenerated = generated != null && (generated.baseCount > 0 || generated.headCount > 0);
	const hasOther = other != null && (other.baseCount > 0 || other.headCount > 0);
	if (rows.length === 0 && total == null && !hasGenerated && !hasOther) return '_No data_';

	const lines = [
		'| Chunk | Base | Head | Δ | Δ (%) |', // nbspにすること
		'| --- | ---: | ---: | ---: | ---: |',
	];
	if (total != null) {
		lines.push(`| (total) | ${formatBytes(total.baseSize)} | ${formatBytes(total.headSize)} | ${calcAndFormatDeltaBytes(total.baseSize, total.headSize, 1000)} | ${calcAndFormatDeltaPercentInMdTable(total.baseSize, total.headSize, 0.1)} |`);
		lines.push('| | | | | |');
	}

	for (const row of rows) {
		const chunkFile = chunkFileDisplay(row);
		if (row.changeType === 'added') {
			lines.push(`| <details><summary>\`${escapeMdTableCell(row.name)}\`</summary> \`${escapeMdTableCell(chunkFile)}\` </details> | ${formatBytes(row.baseSize)} | ${formatBytes(row.headSize)} | ${calcAndFormatDeltaBytes(row.baseSize, row.headSize, 1000)} | $\\color{orange}{\\text{( + )}}$ |`);
		} else if (row.changeType === 'removed') {
			lines.push(`| <details><summary>\`${escapeMdTableCell(row.name)}\`</summary> \`${escapeMdTableCell(chunkFile)}\` </details> | ${formatBytes(row.baseSize)} | ${formatBytes(row.headSize)} | ${calcAndFormatDeltaBytes(row.baseSize, row.headSize, 1000)} | $\\color{green}{\\text{( - )}}$ |`);
		} else {
			lines.push(`| <details><summary>\`${escapeMdTableCell(row.name)}\`</summary> \`${escapeMdTableCell(chunkFile)}\` </details> | ${formatBytes(row.baseSize)} | ${formatBytes(row.headSize)} | ${calcAndFormatDeltaBytes(row.baseSize, row.headSize, 1000)} | ${calcAndFormatDeltaPercentInMdTable(row.baseSize, row.headSize, 0.1)} |`);
		}
	}
	if (hasGenerated) {
		// eslint-disable-next-line no-irregular-whitespace
		lines.push(`| (other generated chunks) | ${formatBytes(generated.baseSize)} | ${formatBytes(generated.headSize)} | ${calcAndFormatDeltaBytes(generated.baseSize, generated.headSize, 1000)} | ${calcAndFormatDeltaPercentInMdTable(generated.baseSize, generated.headSize, 0.1)} |`); // nbspにすること
	}
	if (hasOther) {
		lines.push(`| (other) | ${formatBytes(other.baseSize)} | ${formatBytes(other.headSize)} | ${calcAndFormatDeltaBytes(other.baseSize, other.headSize, 1000)} | ${calcAndFormatDeltaPercentInMdTable(other.baseSize, other.headSize, 0.1)} |`);
	}
	return lines.join('\n');
}

export function renderFrontendChunkReport(base: CollectedBundleReport, head: CollectedBundleReport) {
	const baseComparable = base.comparableChunks;
	const headComparable = head.comparableChunks;
	const allChunkKeys = [...new Set([...Object.keys(baseComparable), ...Object.keys(headComparable)])];
	const allComparisonRows = getChunkComparisonRows(allChunkKeys, baseComparable, headComparable);

	const changedRows = allComparisonRows.filter((row) => row.changeType !== 'unchanged');
	const diffSummary = summarizeChunkChanges(changedRows);
	const diffTotal = {
		baseSize: sumChunkSizes(base.chunks),
		headSize: sumChunkSizes(head.chunks),
	};
	const diffGenerated = generatedAggregate(base.chunks, head.chunks);
	const largeDeltaRows = changedRows.filter(row => !hasSmallDelta(row)).sort(compareChunkComparisonRows);
	const diffRows = largeDeltaRows.slice(0, diffRowLimit);
	// 表示上限で切り捨てた行も `(other)` に含める。落とすと合計が実際の変化量と合わなくなる
	const diffOther = comparisonRowsAggregate([
		...changedRows.filter(hasSmallDelta),
		...largeDeltaRows.slice(diffRowLimit),
	]);

	const baseStartupFiles = new Set(base.startupFiles);
	const headStartupFiles = new Set(head.startupFiles);
	const baseStartupChunks = base.chunks.filter(chunk => baseStartupFiles.has(chunk.file));
	const headStartupChunks = head.chunks.filter(chunk => headStartupFiles.has(chunk.file));
	const baseStartupComparable = comparableMap(baseStartupChunks);
	const headStartupComparable = comparableMap(headStartupChunks);
	const startupKeys = [...new Set([...Object.keys(baseStartupComparable), ...Object.keys(headStartupComparable)])];
	const startupComparisonRows = getChunkComparisonRows(startupKeys, baseStartupComparable, headStartupComparable);
	const startupSummary = summarizeChunkChanges(startupComparisonRows);
	const startupOther = comparisonRowsAggregate(startupComparisonRows.filter(hasSmallDelta));
	const startupRows = startupComparisonRows.filter(row => !hasSmallDelta(row)).sort(compareChunkComparisonRows);
	const startupTotal = {
		baseSize: sumChunkSizes(baseStartupChunks),
		headSize: sumChunkSizes(headStartupChunks),
	};
	const startupGenerated = generatedAggregate(baseStartupChunks, headStartupChunks);

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
