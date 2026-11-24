/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test } from 'vitest';
import { parseSearchRangeDate } from '@/utility/parse-search-range-date.js';

describe('parseSearchRangeDate', () => {
	test('日付のみの開始日時をその日の開始時刻で補完する', () => {
		const timestamp = parseSearchRangeDate('2026-07-18', null, 'start');

		expect(timestamp).toBe(new Date(2026, 6, 18, 0, 0, 0, 0).getTime());
	});

	test('日付のみの終了日時をその日の終了時刻で補完する', () => {
		const timestamp = parseSearchRangeDate('2026-07-18', null, 'end');

		expect(timestamp).toBe(new Date(2026, 6, 18, 23, 59, 59, 999).getTime());
	});

	test('時刻が入力されている場合はその値を維持する', () => {
		const timestamp = parseSearchRangeDate('2026-07-18', '12:34', 'start');

		expect(timestamp).toBe(new Date('2026-07-18T12:34').getTime());
	});

	test.each([null, '', 'invalid', '2026-02-30'])(
		'入力できない値 %s はnullを返す',
		(value) => {
			expect(parseSearchRangeDate(value, null, 'start')).toBeNull();
		},
	);

	test('日付がなければ時刻だけでは検索範囲を作らない', () => {
		expect(parseSearchRangeDate(null, '12:34', 'start')).toBeNull();
	});
});
