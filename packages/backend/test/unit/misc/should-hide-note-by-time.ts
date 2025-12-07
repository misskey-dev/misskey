/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test, beforeEach, afterEach } from '@jest/globals';
import * as lolex from '@sinonjs/fake-timers';
import { shouldHideNoteByTime } from '@/misc/should-hide-note-by-time.js';

describe('misc:should-hide-note-by-time', () => {
	let clock: lolex.InstalledClock;
	const epoch = Date.UTC(2000, 0, 1, 0, 0, 0);

	beforeEach(() => {
		clock = lolex.install({
			// https://github.com/sinonjs/sinon/issues/2620
			toFake: Object.keys(lolex.timers).filter((key) => !['nextTick', 'queueMicrotask'].includes(key)) as lolex.FakeMethod[],
			now: new Date(epoch),
			shouldClearNativeTimers: true,
		});
	});

	afterEach(() => {
		clock.uninstall();
	});

	describe('hiddenBefore が null または undefined の場合', () => {
		test('hiddenBefore が null のときは false を返す（非表示機能が有効でない）', () => {
			const createdAt = new Date(epoch - 86400000); // 1 day ago
			expect(shouldHideNoteByTime(null, createdAt)).toBe(false);
		});

		test('hiddenBefore が undefined のときは false を返す（非表示機能が有効でない）', () => {
			const createdAt = new Date(epoch - 86400000); // 1 day ago
			expect(shouldHideNoteByTime(undefined, createdAt)).toBe(false);
		});
	});

	describe('相対時間モード (hiddenBefore <= 0)', () => {
		test('閾値内に作成されたノートは false を返す（作成からの経過時間がまだ短い→表示）', () => {
			const hiddenBefore = -86400; // 1 day in seconds
			const createdAt = new Date(epoch - 3600000); // 1 hour ago
			expect(shouldHideNoteByTime(hiddenBefore, createdAt)).toBe(false);
		});

		test('閾値を超えて作成されたノートは true を返す（指定期間以上経過している→非表示）', () => {
			const hiddenBefore = -86400; // 1 day in seconds
			const createdAt = new Date(epoch - 172800000); // 2 days ago
			expect(shouldHideNoteByTime(hiddenBefore, createdAt)).toBe(true);
		});

		test('ちょうど閾値で作成されたノートは true を返す（閾値に達したら非表示）', () => {
			const hiddenBefore = -86400; // 1 day in seconds
			const createdAt = new Date(epoch - 86400000); // exactly 1 day ago
			expect(shouldHideNoteByTime(hiddenBefore, createdAt)).toBe(true);
		});

		test('異なる相対時間値で判定できる（1時間設定と3時間設定の異なる結果）', () => {
			const createdAt = new Date(epoch - 7200000); // 2 hours ago
			expect(shouldHideNoteByTime(-3600, createdAt)).toBe(true); // 1時間経過→非表示
			expect(shouldHideNoteByTime(-10800, createdAt)).toBe(false); // 3時間未経過→表示
		});

		test('ISO 8601 形式の文字列の createdAt に対応できる（文字列でも正しく判定）', () => {
			const createdAtString = new Date(epoch - 86400000).toISOString();
			const hiddenBefore = -86400; // 1 day in seconds
			expect(shouldHideNoteByTime(hiddenBefore, createdAtString)).toBe(true);
		});

		test('hiddenBefore が 0 の場合に対応できる（0秒以上経過で非表示→ほぼ全て非表示）', () => {
			const hiddenBefore = 0;
			const createdAt = new Date(epoch - 1); // 1ms ago
			expect(shouldHideNoteByTime(hiddenBefore, createdAt)).toBe(true);
		});
	});

	describe('絶対時間モード (hiddenBefore > 0)', () => {
		test('閾値タイムスタンプより後に作成されたノートは false を返す（指定日時より後→表示）', () => {
			const thresholdSeconds = Math.floor(epoch / 1000);
			const createdAt = new Date(epoch + 3600000); // 1 hour from epoch
			expect(shouldHideNoteByTime(thresholdSeconds, createdAt)).toBe(false);
		});

		test('閾値タイムスタンプより前に作成されたノートは true を返す（指定日時より前→非表示）', () => {
			const thresholdSeconds = Math.floor(epoch / 1000);
			const createdAt = new Date(epoch - 3600000); // 1 hour ago
			expect(shouldHideNoteByTime(thresholdSeconds, createdAt)).toBe(true);
		});

		test('ちょうど閾値タイムスタンプで作成されたノートは true を返す（指定日時に達したら非表示）', () => {
			const thresholdSeconds = Math.floor(epoch / 1000);
			const createdAt = new Date(epoch); // exactly epoch
			expect(shouldHideNoteByTime(thresholdSeconds, createdAt)).toBe(true);
		});

		test('ISO 8601 形式の文字列の createdAt に対応できる（文字列でも正しく判定）', () => {
			const thresholdSeconds = Math.floor(epoch / 1000);
			const createdAtString = new Date(epoch - 3600000).toISOString();
			expect(shouldHideNoteByTime(thresholdSeconds, createdAtString)).toBe(true);
		});

		test('異なる閾値タイムスタンプで判定できる（2021年設定と現在より1時間前設定の異なる結果）', () => {
			const thresholdSeconds = Math.floor((epoch - 86400000) / 1000); // 1 day ago
			const createdAtBefore = new Date(epoch - 172800000); // 2 days ago
			const createdAtAfter = new Date(epoch - 3600000); // 1 hour ago
			expect(shouldHideNoteByTime(thresholdSeconds, createdAtBefore)).toBe(true); // 閾値より前→非表示
			expect(shouldHideNoteByTime(thresholdSeconds, createdAtAfter)).toBe(false); // 閾値より後→表示
		});
	});

	describe('エッジケース', () => {
		test('相対時間モードで非常に古いノートに対応できる（非常に古い→閾値超→非表示）', () => {
			const hiddenBefore = -1; // hide notes older than 1 second
			const createdAt = new Date(epoch - 1000000); // very old
			expect(shouldHideNoteByTime(hiddenBefore, createdAt)).toBe(true);
		});

		test('相対時間モードで非常に新しいノートに対応できる（非常に新しい→閾値未満→表示）', () => {
			const hiddenBefore = -86400; // 1 day
			const createdAt = new Date(epoch - 1); // 1ms ago
			expect(shouldHideNoteByTime(hiddenBefore, createdAt)).toBe(false);
		});

		test('大きなタイムスタンプ値に対応できる（未来の日時を指定→現在のノートは全て非表示）', () => {
			const thresholdSeconds = Math.floor(epoch / 1000) + 86400; // 1 day from epoch
			const createdAt = new Date(epoch); // created epoch
			expect(shouldHideNoteByTime(thresholdSeconds, createdAt)).toBe(true);
		});

		test('小さな相対時間値に対応できる（1秒設定で2秒前→非表示）', () => {
			const hiddenBefore = -1; // 1 second
			const createdAt = new Date(epoch - 2000); // 2 seconds ago
			expect(shouldHideNoteByTime(hiddenBefore, createdAt)).toBe(true);
		});
	});
});
