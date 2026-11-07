/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test } from 'vitest';
import { html, joinHtml, raw, Raw } from '../src/html';

describe('html', () => {
	test('escapes interpolated values by default', () => {
		const value = '<script>alert(1)</script>';
		expect(String(html`<p>${value}</p>`)).toBe('<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>');
	});

	test('escapes values used in attribute position', () => {
		const url = 'x"><script>alert(1)</script>';
		expect(String(html`<a href="${url}"></a>`)).toBe('<a href="x&quot;&gt;&lt;script&gt;alert(1)&lt;/script&gt;"></a>');
	});

	test('leaves the static parts of the template untouched', () => {
		expect(String(html`<p class="a">x</p>`)).toBe('<p class="a">x</p>');
	});

	test('renders nullish values as an empty string', () => {
		expect(String(html`<p>${null}${undefined}</p>`)).toBe('<p></p>');
	});

	test('does not double-escape nested fragments', () => {
		const inner = html`<b>${'a&b'}</b>`;
		expect(String(html`<p>${inner}</p>`)).toBe('<p><b>a&amp;b</b></p>');
	});

	// 配列をそのまま文字列化するとカンマ区切りで潰れる。実際に過去これで表が壊れた
	test('joins arrays without separators instead of stringifying them', () => {
		const items = [html`<li>1</li>`, html`<li>2</li>`];
		expect(String(html`<ul>${items}</ul>`)).toBe('<ul><li>1</li><li>2</li></ul>');
	});

	test('escapes array elements that are not fragments', () => {
		expect(String(html`<p>${['<a>', '<b>']}</p>`)).toBe('<p>&lt;a&gt;&lt;b&gt;</p>');
	});
});

describe('raw', () => {
	test('embeds trusted markup without escaping', () => {
		expect(String(html`<style>${raw('a > b { color: red }')}</style>`)).toBe('<style>a > b { color: red }</style>');
	});

	test('produces a Raw fragment', () => {
		expect(raw('x')).toBeInstanceOf(Raw);
		expect(html`x`).toBeInstanceOf(Raw);
	});
});

describe('joinHtml', () => {
	test('joins fragments with the given separator', () => {
		expect(String(joinHtml([html`<li>1</li>`, html`<li>2</li>`], '\n'))).toBe('<li>1</li>\n<li>2</li>');
	});

	test('returns an empty fragment for an empty list', () => {
		expect(String(joinHtml([], '\n'))).toBe('');
	});
});
