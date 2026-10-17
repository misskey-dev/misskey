/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test } from 'vitest';
import { getProxyTargetUrl, validateProxyUserAgent } from '../src/proxy-request.js';
import { StatusError } from '../src/status-error.js';

describe(getProxyTargetUrl, () => {
	test('url クエリを優先する', () => {
		expect(getProxyTargetUrl('example.com/path.png', { url: 'https://example.net/image.png' })).toBe('https://example.net/image.png');
	});

	test('url クエリがなければパス部分を https の URL として扱う', () => {
		expect(getProxyTargetUrl('example.com/path.png', {})).toBe('https://example.com/path.png');
	});

	test('url クエリもパスもなければ null を返す', () => {
		expect(getProxyTargetUrl(undefined, {})).toBeNull();
		expect(getProxyTargetUrl('', {})).toBeNull();
	});

	test('url クエリが空文字列なら null を返す', () => {
		expect(getProxyTargetUrl('example.com/path.png', { url: '' })).toBeNull();
	});

	test('url クエリが文字列でなければ null を返す', () => {
		// 同名のクエリが複数指定されると配列になる
		expect(getProxyTargetUrl(undefined, { url: ['a', 'b'] as unknown as string })).toBeNull();
	});
});

function getStatusCode(fn: () => unknown): number | null {
	try {
		fn();
	} catch (e) {
		if (e instanceof StatusError) return e.statusCode;
		throw e;
	}
	return null;
}

describe(validateProxyUserAgent, () => {
	test('User-Agent がなければ 400', () => {
		expect(getStatusCode(() => validateProxyUserAgent(undefined))).toBe(400);
		expect(getStatusCode(() => validateProxyUserAgent(''))).toBe(400);
	});

	test('Misskey の User-Agent (プロキシの再帰) は 403', () => {
		expect(getStatusCode(() => validateProxyUserAgent('Misskey/2026.10.0 (https://example.com)'))).toBe(403);
	});

	test('通常の User-Agent は許可する', () => {
		expect(getStatusCode(() => validateProxyUserAgent('Mozilla/5.0'))).toBeNull();
	});
});
