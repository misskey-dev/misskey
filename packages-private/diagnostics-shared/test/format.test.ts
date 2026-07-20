/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test } from 'vitest';
import {
	calcAndFormatDeltaPercent,
	calcAndFormatDeltaPercentInMdTable,
	escapeHtml,
	escapeLatex,
	escapeMdTableCell,
	formatBytes,
	formatColoredDelta,
	formatKiBAsMb,
	formatMs,
	formatNumber,
} from '../src/format';

describe('formatBytes', () => {
	// 1024ではなく1000区切り。単位が2桁以上なら小数を落とす
	test.each([
		[0, '0 B'],
		[999, '999 B'],
		[1_000, '1 KB'],
		[1_500, '1.5 KB'],
		[15_000, '15 KB'],
		[1_234_567, '1.2 MB'],
		[12_345_678, '12 MB'],
		[1_500_000_000, '1.5 GB'],
		[1_500_000_000_000, '1,500 GB'],
	])('formats %i as %s', (input, expected) => {
		expect(formatBytes(input)).toBe(expected);
	});
});

describe('formatColoredDelta', () => {
	test('leaves zero uncoloured and unsigned', () => {
		expect(formatColoredDelta(0, formatNumber)).toBe('0');
	});

	test('colours growth orange and shrinkage green', () => {
		expect(formatColoredDelta(5, formatNumber)).toBe('$\\color{orange}{\\text{+5}}$');
		expect(formatColoredDelta(-5, formatNumber)).toBe('$\\color{green}{\\text{-5}}$');
	});

	test('omits colour below the threshold but keeps the sign', () => {
		expect(formatColoredDelta(5, formatNumber, 10)).toBe('$\\text{+5}$');
	});
});

describe('escaping', () => {
	test('escapeHtml covers the five metacharacters', () => {
		expect(escapeHtml(`&<>"'`)).toBe('&amp;&lt;&gt;&quot;&#39;');
	});

	test('escapeHtml maps nullish to an empty string', () => {
		expect(escapeHtml(null)).toBe('');
		expect(escapeHtml(undefined)).toBe('');
	});

	test('escapeLatex escapes braces and percent', () => {
		expect(escapeLatex('100% {x}')).toBe('100\\% \\{x\\}');
	});

	test('escapeMdTableCell keeps pipes and newlines from breaking the table', () => {
		expect(escapeMdTableCell('a|b\nc')).toBe('a\\|b<br>c');
	});
});

describe('percent helpers', () => {
	// before が0だと変化率そのものが定義できない
	test('returns a placeholder when the baseline is zero or missing', () => {
		expect(calcAndFormatDeltaPercent(0, 10)).toBe('-');
		expect(calcAndFormatDeltaPercent(null, 10)).toBe('-');
		expect(calcAndFormatDeltaPercent(10, null)).toBe('-');
	});

	// 0になったのは「消えた」という有効な結果なので、隠さず -100% として出す
	test('formats a drop to zero as -100%', () => {
		expect(calcAndFormatDeltaPercent(10, 0)).toBe('$\\color{green}{\\text{-100\\%}}$');
	});

	// Markdownのテーブルセル内ではLaTeXの \% がさらに食われるため二重にする
	test('doubles the percent escape for markdown table cells', () => {
		expect(calcAndFormatDeltaPercentInMdTable(100, 110)).toContain('\\\\%');
		expect(calcAndFormatDeltaPercent(100, 110)).not.toContain('\\\\%');
	});
});

describe('nullish handling', () => {
	test('formatKiBAsMb and formatMs render a dash for missing values', () => {
		expect(formatKiBAsMb(null)).toBe('-');
		expect(formatKiBAsMb(Number.NaN)).toBe('-');
		expect(formatMs(undefined)).toBe('-');
	});

	test('formatMs switches to seconds past 1000ms', () => {
		expect(formatMs(999)).toBe('999 ms');
		expect(formatMs(1_500)).toBe('1.5 s');
	});
});
