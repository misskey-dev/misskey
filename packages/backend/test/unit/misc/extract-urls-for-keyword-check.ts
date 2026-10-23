/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test } from 'vitest';
import { extractUrlsForKeyWordCheck } from '@/misc/extract-urls-for-keyword-check.js';
import { DB_MAX_NOTE_TEXT_LENGTH } from '@/const.js';

describe('extractUrlsForKeyWordCheck', () => {
	test('URLを含まない場合は空', () => {
		expect(extractUrlsForKeyWordCheck('')).toEqual([]);
		expect(extractUrlsForKeyWordCheck('hello world')).toEqual([]);
	});

	test('通常のURLはそのまま', () => {
		expect(extractUrlsForKeyWordCheck('see https://example.com/path')).toEqual([
			'https://example.com/path',
			'https://example.com/path',
		]);
	});

	test('ホスト名のパーセントエンコーディングがデコードされる', () => {
		expect(extractUrlsForKeyWordCheck('https://%65xample.com/')).toContain('https://example.com/');
		expect(extractUrlsForKeyWordCheck('https://exa%6Dple%2Ecom/')).toContain('https://example.com/');
	});

	test('ホスト名の大文字が小文字になる', () => {
		expect(extractUrlsForKeyWordCheck('https://EXAMPLE.com/')).toContain('https://example.com/');
	});

	test('全角文字のホスト名が正規化される', () => {
		expect(extractUrlsForKeyWordCheck('<https://ｅｘａｍｐｌｅ．com/>')).toContain('https://example.com/');
		expect(extractUrlsForKeyWordCheck('<https://example。com/>')).toContain('https://example.com/');
	});

	test('リンク構文のURLも対象になる', () => {
		expect(extractUrlsForKeyWordCheck('[label](https://%65xample.com/)')).toContain('https://example.com/');
	});

	test('パス以降のパーセントエンコーディングがデコードされる', () => {
		expect(extractUrlsForKeyWordCheck('https://example.com/%E7%A6%81%E6%AD%A2?q=%E7%A6%81#%E7%A6%81')).toContain('https://example.com/禁止?q=禁#禁');
	});

	test('Punycodeのホスト名はUnicodeでも得られる', () => {
		expect(extractUrlsForKeyWordCheck('https://xn--r8jz45g.jp/')).toEqual([
			'https://xn--r8jz45g.jp/',
			'https://例え.jp/',
		]);
	});

	test('ポート番号が保持される', () => {
		expect(extractUrlsForKeyWordCheck('https://%65xample.com:8080/')).toContain('https://example.com:8080/');
	});

	test('不正なパーセントエンコーディングでも例外にならない', () => {
		expect(extractUrlsForKeyWordCheck('https://example.com/%E7%A6')).toEqual([
			'https://example.com/%E7%A6',
			'https://example.com/%E7%A6',
		]);
	});

	test('不正なパーセントエンコーディングが混在していても有効な部分はデコードされる', () => {
		expect(extractUrlsForKeyWordCheck('https://example.com/%E7%A6%81%E6%AD%A2/%E7%A6?q=%E7%A6%81%FF%E6%AD%A2#%E7%A6%E7%A6%81')).toContain('https://example.com/禁止/%E7%A6?q=禁%FF止#%E7%A6禁');
		expect(extractUrlsForKeyWordCheck('https://example.com/%zz%E7%A6%81')).toContain('https://example.com/%zz禁');
	});

	test('保存時に切り詰められる範囲より後ろのURLは対象外', () => {
		const padding = 'a'.repeat(DB_MAX_NOTE_TEXT_LENGTH);
		expect(extractUrlsForKeyWordCheck(`${padding} https://%65xample.com/`)).toEqual([]);
	});
});
