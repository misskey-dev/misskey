import * as assert from 'assert';
import * as mfm from 'mfm-js';

import { toHtml } from '../../src/mfm/to-html.js';
import { fromHtml } from '../../src/mfm/from-html.js';

describe('toHtml', () => {
	test('br', () => {
		const input = 'foo\nbar\nbaz';
		const output = '<p><span>foo<br>bar<br>baz</span></p>';
		assert.equal(toHtml(mfm.parse(input)), output);
	});

	test('br alt', () => {
		const input = 'foo\r\nbar\rbaz';
		const output = '<p><span>foo<br>bar<br>baz</span></p>';
		assert.equal(toHtml(mfm.parse(input)), output);
	});
});

describe('fromHtml', () => {
	test('p', () => {
		assert.deepStrictEqual(fromHtml('<p>a</p><p>b</p>'), 'a\n\nb');
	});

	test('block element', () => {
		assert.deepStrictEqual(fromHtml('<div>a</div><div>b</div>'), 'a\nb');
	});

	test('inline element', () => {
		assert.deepStrictEqual(fromHtml('<ul><li>a</li><li>b</li></ul>'), 'a\nb');
	});

	test('block code', () => {
		assert.deepStrictEqual(fromHtml('<pre><code>a\nb</code></pre>'), '```\na\nb\n```');
	});

	test('inline code', () => {
		assert.deepStrictEqual(fromHtml('<code>a</code>'), '`a`');
	});

	test('quote', () => {
		assert.deepStrictEqual(fromHtml('<blockquote>a\nb</blockquote>'), '> a\n> b');
	});

	test('br', () => {
		assert.deepStrictEqual(fromHtml('<p>abc<br><br/>d</p>'), 'abc\n\nd');
	});

	test('link with different text', () => {
		assert.deepStrictEqual(fromHtml('<p>a <a href="https://example.com/b">c</a> d</p>'), 'a [c](https://example.com/b) d');
	});

	test('link with different text, but not encoded', () => {
		assert.deepStrictEqual(fromHtml('<p>a <a href="https://example.com/ä">c</a> d</p>'), 'a [c](<https://example.com/ä>) d');
	});

	test('link with same text', () => {
		assert.deepStrictEqual(fromHtml('<p>a <a href="https://example.com/b">https://example.com/b</a> d</p>'), 'a https://example.com/b d');
	});

	test('link with same text, but not encoded', () => {
		assert.deepStrictEqual(fromHtml('<p>a <a href="https://example.com/ä">https://example.com/ä</a> d</p>'), 'a <https://example.com/ä> d');
	});

	test('link with no url', () => {
		assert.deepStrictEqual(fromHtml('<p>a <a href="b">c</a> d</p>'), 'a [c](b) d');
	});

	test('link without href', () => {
		assert.deepStrictEqual(fromHtml('<p>a <a>c</a> d</p>'), 'a c d');
	});

	test('link without text', () => {
		assert.deepStrictEqual(fromHtml('<p>a <a href="https://example.com/b"></a> d</p>'), 'a https://example.com/b d');
	});

	test('link without both', () => {
		assert.deepStrictEqual(fromHtml('<p>a <a></a> d</p>'), 'a  d');
	});

	test('mention', () => {
		assert.deepStrictEqual(fromHtml('<p>a <a href="https://example.com/@user" class="u-url mention">@user</a> d</p>'), 'a @user@example.com d');
	});

	test('hashtag', () => {
		assert.deepStrictEqual(fromHtml('<p>a <a href="https://example.com/tags/a">#a</a> d</p>', ['#a']), 'a #a d');
	});
});
