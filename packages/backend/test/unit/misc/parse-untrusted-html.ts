/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test } from 'vitest';
import {
	parseUntrustedHtml,
	UNTRUSTED_HTML_MAX_DEPTH,
	UNTRUSTED_HTML_MAX_LENGTH,
	UntrustedHtmlLimitError,
} from '@/misc/parse-untrusted-html.js';

describe(parseUntrustedHtml, () => {
	test('parses well-formed HTML', () => {
		const doc = parseUntrustedHtml('<html><head><link rel="redirect_uri" href="https://example.com/cb"></head><body><div class="h-app"><a class="p-name u-url" href="/">App</a></div></body></html>');
		expect(doc.querySelectorAll('link[rel=redirect_uri][href]').map(el => el.attributes.href)).toEqual(['https://example.com/cb']);
		expect(doc.querySelector('.h-app .p-name')?.textContent).toBe('App');
	});

	test('keeps unclosed elements instead of removing them', () => {
		// node-html-parser のデフォルト設定では閉じられていない div.h-app は取り除かれる
		const doc = parseUntrustedHtml('<body><div class="h-app"><a class="p-name" href="/">App</a></body>');
		expect(doc.querySelector('.h-app')).not.toBeNull();
		expect(doc.querySelector('.h-app .p-name')?.textContent).toBe('App');
	});

	test('rejects too large input', () => {
		expect(() => parseUntrustedHtml('a'.repeat(UNTRUSTED_HTML_MAX_LENGTH + 1))).toThrow(UntrustedHtmlLimitError);
	});

	test('accepts nesting up to the depth limit', () => {
		const html = '<div>'.repeat(UNTRUSTED_HTML_MAX_DEPTH) + 'x' + '</div>'.repeat(UNTRUSTED_HTML_MAX_DEPTH);
		expect(parseUntrustedHtml(html).textContent).toBe('x');
	});

	test('rejects too deeply nested input', () => {
		const html = '<div>'.repeat(UNTRUSTED_HTML_MAX_DEPTH + 1) + 'x' + '</div>'.repeat(UNTRUSTED_HTML_MAX_DEPTH + 1);
		expect(() => parseUntrustedHtml(html)).toThrow(UntrustedHtmlLimitError);
	});

	test('handles many unclosed nested elements in linear time', () => {
		// node-html-parser のデフォルト設定ではこの入力のパースに数十秒以上かかる
		const html = '<div>'.repeat(Math.floor(UNTRUSTED_HTML_MAX_LENGTH / 5));
		const start = performance.now();
		expect(() => parseUntrustedHtml(html)).toThrow(UntrustedHtmlLimitError);
		expect(performance.now() - start).toBeLessThan(5000);
	});
});
