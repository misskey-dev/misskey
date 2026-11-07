/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test } from 'vitest';
import { followApprovalPeriodFromSeconds, followApprovalPeriodToSeconds } from '@/utility/follow-approval.js';

describe('フォロー承認期間の単位変換', () => {
	test('0.5日と12時間を同じ秒数に変換する', () => {
		expect(followApprovalPeriodToSeconds(0.5, 'day')).toBe(43200);
		expect(followApprovalPeriodToSeconds(12, 'hour')).toBe(43200);
		expect(followApprovalPeriodToSeconds(7, 'day')).toBe(604800);
	});

	test('日単位で割り切れる期間は日、それ以外は時間で表示する', () => {
		expect(followApprovalPeriodFromSeconds(604800)).toEqual({ amount: 7, unit: 'day' });
		expect(followApprovalPeriodFromSeconds(43200)).toEqual({ amount: 12, unit: 'hour' });
	});

	test.each([1, 12345, 2592000])('APIの期間を表示値に変換して戻しても秒数が変わらない: %s秒', seconds => {
		const period = followApprovalPeriodFromSeconds(seconds);
		expect(followApprovalPeriodToSeconds(period.amount, period.unit)).toBe(seconds);
	});

	test('日・時間のどちらでも30日は受け付け、30日と1秒は拒否する', () => {
		expect(followApprovalPeriodToSeconds(30, 'day')).toBe(2592000);
		expect(followApprovalPeriodToSeconds(720, 'hour')).toBe(2592000);
		expect(followApprovalPeriodToSeconds(2592001 / 86400, 'day')).toBeNull();
		expect(followApprovalPeriodToSeconds(2592001 / 3600, 'hour')).toBeNull();
	});

	test.each([null, 0, -1, NaN, Infinity, 2147483648])('不正な期間の入力を拒否する: %s', amount => {
		expect(followApprovalPeriodToSeconds(amount, 'hour')).toBeNull();
	});

	test('秒単位で四捨五入し、0秒になる期間は拒否する', () => {
		expect(followApprovalPeriodToSeconds(1.5 / 3600, 'hour')).toBe(2);
		expect(followApprovalPeriodToSeconds(0.1 / 3600, 'hour')).toBeNull();
	});
});
