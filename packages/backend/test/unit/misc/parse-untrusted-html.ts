/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test } from 'vitest';
import {
	parseUntrustedHtml,
	UNTRUSTED_HTML_MAX_DEPTH,
	UNTRUSTED_HTML_MAX_LENGTH,
	UNTRUSTED_HTML_MAX_TAG_NAME_LENGTH,
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

	test.each([
		['<!--', '-->'],
		['<![CDATA[', ']]>'],
	])('handles many unterminated %s in linear time', (opener, terminator) => {
		// node-html-parser はこの入力を二乗時間でパースし、1MB では 30 秒前後かかる
		const html = terminator + opener.repeat(Math.floor((UNTRUSTED_HTML_MAX_LENGTH - terminator.length) / opener.length));
		const start = performance.now();
		parseUntrustedHtml(html);
		expect(performance.now() - start).toBeLessThan(5000);
	});

	test('keeps comments and CDATA sections that have a terminator', () => {
		const doc = parseUntrustedHtml('<p>a<!-- comment -->b<!---->c<![CDATA[d]]>e</p>');
		expect(doc.querySelector('p')?.textContent).toBe('ab' + 'c' + '<![CDATA[d]]>' + 'e');
	});

	test('treats unterminated comment and CDATA openers as text, as before', () => {
		// 2 つ目の <!-- と <![CDATA[ は後ろに終端が無いので、node-html-parser でもテキストとして扱われる
		const doc = parseUntrustedHtml('<p>a<!-- b --> c <!-- d<a href="/x">e</a> f <![CDATA[ g</p>');
		expect(doc.querySelector('p')?.textContent).toBe('a c <!-- de f <![CDATA[ g');
		expect(doc.querySelector('a')?.attributes.href).toBe('/x');
	});

	test('keeps self-closing tags whose unquoted attribute value ends with an unterminated opener, as before', () => {
		// node-html-parser は引用符の無い属性値に < が含まれると、続く / を属性値ではなく自己終了とみなす
		const doc = parseUntrustedHtml('<div><a title=x<!--/>b</div>');
		expect(doc.querySelector('a')?.attributes.title).toBe('x<!--');
		expect(doc.querySelector('a')?.childNodes.length).toBe(0);
		expect(doc.querySelector('div')?.textContent).toBe('b');
	});

	test('closes a comment with a terminator that overlaps a later opener, as before', () => {
		// <!--> の --> が手前のコメントの終端になる
		expect(parseUntrustedHtml('<!--a<!-->b').textContent).toBe('b');
	});

	test('keeps unterminated openers inside raw text elements, as before', () => {
		const doc = parseUntrustedHtml('<pre><code><!-- &amp; <![CDATA[</code></pre>');
		expect(doc.querySelector('pre')?.textContent).toBe('<code><!-- & <![CDATA[</code>');
	});

	test('accepts tag names up to the length limit', () => {
		const name = 'a'.repeat(UNTRUSTED_HTML_MAX_TAG_NAME_LENGTH);
		const doc = parseUntrustedHtml(`<p>x<${name}>y</${name}></p>`);
		expect(doc.querySelector('p')?.textContent).toBe('xy');
	});

	test('rejects too long tag names', () => {
		const name = 'a'.repeat(UNTRUSTED_HTML_MAX_TAG_NAME_LENGTH + 1);
		expect(() => parseUntrustedHtml(`<p>x<${name}>y</p>`)).toThrow(UntrustedHtmlLimitError);
	});

	test('handles many mismatched closing tags inside an element with a long name in linear time', () => {
		// node-html-parser は一致しない閉じタグのたびに親のタグ名全体を変換するため、
		// タグ名の長さを制限しないと 1MB で 10 秒前後かかる
		const open = `<${'a'.repeat(UNTRUSTED_HTML_MAX_TAG_NAME_LENGTH)}>`;
		const html = open + '</b>'.repeat(Math.floor((UNTRUSTED_HTML_MAX_LENGTH - open.length) / 4));
		const start = performance.now();
		parseUntrustedHtml(html);
		expect(performance.now() - start).toBeLessThan(5000);
	});
});
