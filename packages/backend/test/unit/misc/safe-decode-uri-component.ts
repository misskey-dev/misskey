/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test } from 'vitest';
import { safeDecodeURIComponent } from '@/misc/safe-decode-uri-component.js';

describe('safeDecodeURIComponent', () => {
	test('有効なパーセントエンコーディングはデコードされる', () => {
		expect(safeDecodeURIComponent('/%E7%A6%81%E6%AD%A2')).toBe('/禁止');
		expect(safeDecodeURIComponent('%F0%9F%98%80')).toBe('😀');
	});

	test('不正なエスケープはそのまま残る', () => {
		expect(safeDecodeURIComponent('%E7%A6')).toBe('%E7%A6');
		expect(safeDecodeURIComponent('%zz')).toBe('%zz');
	});

	test('有効な部分と不正な部分が混在していても有効な部分はデコードされる', () => {
		expect(safeDecodeURIComponent('%E7%A6%81%FF%E6%AD%A2')).toBe('禁%FF止');
		expect(safeDecodeURIComponent('%E7%A6%E7%A6%81')).toBe('%E7%A6禁');
		expect(safeDecodeURIComponent('%zz%E7%A6%81')).toBe('%zz禁');
	});

	test('冗長表現・サロゲート・U+10FFFF超はdecodeURIComponentと同様に不正として扱う', () => {
		expect(safeDecodeURIComponent('%C0%AF')).toBe('%C0%AF');
		expect(safeDecodeURIComponent('%E0%80%AF')).toBe('%E0%80%AF');
		expect(safeDecodeURIComponent('%ED%A0%80')).toBe('%ED%A0%80');
		expect(safeDecodeURIComponent('%F4%90%80%80')).toBe('%F4%90%80%80');
		expect(safeDecodeURIComponent('%ED%9F%BF%FF')).toBe('퟿%FF');
		expect(safeDecodeURIComponent('%F4%8F%BF%BF%FF')).toBe('\u{10FFFF}%FF');
	});
});
