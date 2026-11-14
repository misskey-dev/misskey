/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test } from 'vitest';
import { getBaseMime, getSafeContentType, isBrowserSafeMime } from '@/server/file/FileServerUtils.js';

describe('getBaseMime', () => {
	test('パラメータなしはそのまま小文字化', () => {
		expect(getBaseMime('image/png')).toBe('image/png');
	});
	test('パラメータ付きはベース部分のみ', () => {
		expect(getBaseMime('text/plain; charset=utf-8')).toBe('text/plain');
	});
	test('大文字は小文字に正規化される', () => {
		expect(getBaseMime('TEXT/PLAIN')).toBe('text/plain');
	});
	test('前後空白を除去する', () => {
		expect(getBaseMime('  image/png  ')).toBe('image/png');
	});
});

describe('isBrowserSafeMime', () => {
	test('許可リストの MIME は true', () => {
		expect(isBrowserSafeMime('image/png')).toBe(true);
	});
	test('未許可 MIME は false', () => {
		expect(isBrowserSafeMime('application/x-msdownload')).toBe(false);
	});
	test('パラメータ付きでもベースで判定する', () => {
		expect(isBrowserSafeMime('text/plain; charset=Shift_JIS')).toBe(true);
	});
});

describe('getSafeContentType', () => {
	test('browser-safe MIME はそのまま返る', () => {
		expect(getSafeContentType('image/png')).toBe('image/png');
	});
	test('未許可 MIME は application/octet-stream', () => {
		expect(getSafeContentType('application/x-msdownload')).toBe('application/octet-stream');
	});
	test('未許可 MIME はパラメータ付きでも application/octet-stream', () => {
		expect(getSafeContentType('application/x-evil; charset=utf-8')).toBe('application/octet-stream');
	});
	test('空文字列は application/octet-stream', () => {
		expect(getSafeContentType('')).toBe('application/octet-stream');
	});
	test('text/plain は charset=utf-8 が補われる', () => {
		expect(getSafeContentType('text/plain')).toBe('text/plain; charset=utf-8');
	});
	test('text/plain で既存 charset があれば維持する (値の大小は保持)', () => {
		expect(getSafeContentType('text/plain; charset=Shift_JIS')).toBe('text/plain; charset=Shift_JIS');
	});
	test('CHARSET の大文字 key も charset 付与スキップ判定に効く', () => {
		expect(getSafeContentType('text/plain; CHARSET=utf-8')).toBe('text/plain; charset=utf-8');
	});
	test('大文字 base MIME も小文字に正規化されて許可される', () => {
		expect(getSafeContentType('TEXT/PLAIN')).toBe('text/plain; charset=utf-8');
	});
	test('text/csv も charset=utf-8 が補われる', () => {
		expect(getSafeContentType('text/csv')).toBe('text/csv; charset=utf-8');
	});
	test('text/csv で既存 charset があれば維持する', () => {
		expect(getSafeContentType('text/csv; charset=Shift_JIS')).toBe('text/csv; charset=Shift_JIS');
	});
	test('image 等の非 text/* には charset は補われない', () => {
		expect(getSafeContentType('image/png')).toBe('image/png');
	});
	test('image/png のパラメータも保持される', () => {
		expect(getSafeContentType('image/png; foo=bar')).toBe('image/png; foo=bar');
	});
	test('CRLF を含む不正なパラメータ値は黙って捨てる', () => {
		expect(getSafeContentType('text/plain; charset=utf-8\r\nX-Injected: foo'))
			.toBe('text/plain; charset=utf-8');
	});
	test('= を含まないパラメータ片は捨てる', () => {
		expect(getSafeContentType('text/plain; garbage')).toBe('text/plain; charset=utf-8');
	});
	test('空のパラメータ片は捨てる', () => {
		expect(getSafeContentType('text/plain;;charset=utf-8')).toBe('text/plain; charset=utf-8');
	});
	test('クォート付き charset 値はクォートを剥がして保持する', () => {
		expect(getSafeContentType('text/plain; charset="utf-8"')).toBe('text/plain; charset=utf-8');
	});
	test('クォート付き Shift_JIS もクォートを剥がして保持する', () => {
		expect(getSafeContentType('text/plain; charset="Shift_JIS"')).toBe('text/plain; charset=Shift_JIS');
	});
	test('クォート内に不正文字がある場合は捨てる', () => {
		expect(getSafeContentType('text/plain; charset="utf-8; evil=x"')).toBe('text/plain; charset=utf-8');
	});
});
