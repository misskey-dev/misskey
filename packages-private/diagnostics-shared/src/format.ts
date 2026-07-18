/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

const numberFormatter = new Intl.NumberFormat('en-US', {
	maximumFractionDigits: 1,
});

export function escapeLatex(text: string) {
	return text
		.replaceAll('\\', '\\\\')
		.replaceAll('{', '\\{')
		.replaceAll('}', '\\}')
		.replaceAll('%', '\\%');
}

export function escapeMdTableCell(value: string) {
	return String(value).replaceAll('|', '\\|').replaceAll('\n', '<br>');
}

export function escapeHtml(value: unknown) {
	return String(value ?? '')
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll('\'', '&#39;');
}

export function formatNumber(value: number) {
	return numberFormatter.format(value);
}

export function formatBytes(value: number) {
	if (value === 0) return '0 B';
	const units = ['B', 'KB', 'MB', 'GB'];
	let unitIndex = 0;
	let size = value;
	while (size >= 1000 && unitIndex < units.length - 1) {
		size /= 1000;
		unitIndex += 1;
	}

	const maximumFractionDigits = size >= 10 || unitIndex === 0 ? 0 : 1;
	return `${numberFormatter.format(Number(size.toFixed(maximumFractionDigits)))} ${units[unitIndex]}`;
}

/**
 * KiB単位の値をMB表記にする。/proc 由来の値の表示に使う。
 */
export function formatKiBAsMb(valueKiB: number | null | undefined) {
	if (valueKiB == null || !Number.isFinite(valueKiB)) return '-';
	return `${formatNumber(valueKiB / 1000)} MB`;
}

export function formatPercent(value: number) {
	return `${formatNumber(value)}%`;
}

export function formatMs(value: number | null | undefined) {
	if (value == null || !Number.isFinite(value)) return '-';
	if (value >= 1_000) return `${formatNumber(value / 1_000)} s`;
	return `${formatNumber(value)} ms`;
}

export function formatSecondsAsMs(value: number | null | undefined) {
	if (value == null || !Number.isFinite(value)) return '-';
	return formatMs(value * 1_000);
}

/**
 * 差分値を符号付きで整形する。`colorThreshold` 以上の変化があるときだけ色を付ける。
 */
export function formatColoredDelta(delta: number, text: (value: number) => string, colorThreshold = 0) {
	if (delta === 0) return text(0);
	const sign = delta > 0 ? '+' : '-';
	if (Math.abs(delta) < colorThreshold) return `$\\text{${sign}${escapeLatex(text(Math.abs(delta)))}}$`;
	const color = delta > 0 ? 'orange' : 'green';
	return `$\\color{${color}}{\\text{${sign}${escapeLatex(text(Math.abs(delta)))}}}$`;
}

export function formatDeltaBytes(deltaBytes: number, colorThreshold = 0) {
	return formatColoredDelta(deltaBytes, formatBytes, colorThreshold);
}

export function formatDeltaPercent(deltaPercent: number, colorThreshold = 0) {
	return formatColoredDelta(deltaPercent, formatPercent, colorThreshold);
}

/**
 * Markdownのテーブルセル内に置く差分パーセント。
 * LaTeX由来の `\%` がMarkdownのエスケープで食われるため二重エスケープする。
 */
export function formatDeltaPercentInMdTable(deltaPercent: number, colorThreshold = 0) {
	return formatDeltaPercent(deltaPercent, colorThreshold).replaceAll('\\%', '\\\\%');
}

export function calcAndFormatDeltaNumber(before: number | null | undefined, after: number | null | undefined, colorThreshold = 0) {
	if (before == null || after == null) return '-';
	return formatColoredDelta(after - before, formatNumber, colorThreshold);
}

export function calcAndFormatDeltaBytes(before: number | null | undefined, after: number | null | undefined, colorThreshold = 0) {
	if (before == null || after == null) return '-';
	return formatDeltaBytes(after - before, colorThreshold);
}

export function calcAndFormatDeltaPercent(before: number | null | undefined, after: number | null | undefined, colorThreshold = 0) {
	if (before == null || before === 0 || after == null) return '-';
	return formatDeltaPercent((after - before) / before * 100, colorThreshold);
}

export function calcAndFormatDeltaPercentInMdTable(before: number | null | undefined, after: number | null | undefined, colorThreshold = 0) {
	return calcAndFormatDeltaPercent(before, after, colorThreshold).replaceAll('\\%', '\\\\%');
}
