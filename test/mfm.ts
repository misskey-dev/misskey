/*
 * Tests of MFM
 */

import * as assert from 'assert';

import analyze from '../src/mfm/parse';
import toHtml from '../src/mfm/html';

describe('Text', () => {
	it('can be analyzed', () => {
		const tokens = analyze('@himawari @hima_sub@namori.net お腹ペコい :cat: #yryr');
		assert.deepEqual([
			{ name: 'mention', props: { canonical: '@himawari', username: 'himawari', host: null } },
			{ name: 'text' },
			{ name: 'mention', props: { canonical: '@hima_sub@namori.net', username: 'hima_sub', host: 'namori.net' } },
			{ name: 'text' },
			{ name: 'emoji', props: { name: 'cat' } },
			{ name: 'text' },
			{ name: 'hashtag', props: { hashtag: 'yryr' } }
		], tokens);
	});

	describe('elements', () => {
		it('bold', () => {
			const tokens = analyze('**Strawberry** Pasta');
			assert.deepEqual([
				{ name: 'bold', children: [{ name: 'text', text: 'Strawberry' }] },
				{ name: 'text' }
			], tokens);
		});

		it('big', () => {
			const tokens = analyze('***Strawberry*** Pasta');
			assert.deepEqual([
				{ name: 'big', children: [{ name: 'text', text: 'Strawberry' }] },
				{ name: 'text' }
			], tokens);
		});

		it('motion', () => {
			const tokens1 = analyze('(((Strawberry))) Pasta');
			assert.deepEqual([
				{ name: 'motion', motion: 'Strawberry' },
				{ name: 'text' }
			], tokens1);

			const tokens2 = analyze('<motion>Strawberry</motion> Pasta');
			assert.deepEqual([
				{ name: 'motion', motion: 'Strawberry' },
				{ name: 'text' }
			], tokens2);
		});

		describe('mention', () => {
			it('local', () => {
				const tokens = analyze('@himawari お腹ペコい');
				assert.deepEqual([
					{ name: 'mention', canonical: '@himawari', username: 'himawari', host: null },
					{ name: 'text' }
				], tokens);
			});

			it('remote', () => {
				const tokens = analyze('@hima_sub@namori.net お腹ペコい');
				assert.deepEqual([
					{ name: 'mention', canonical: '@hima_sub@namori.net', username: 'hima_sub', host: 'namori.net' },
					{ name: 'text' }
				], tokens);
			});

			it('remote punycode', () => {
				const tokens = analyze('@hima_sub@xn--q9j5bya.xn--zckzah お腹ペコい');
				assert.deepEqual([
					{ name: 'mention', canonical: '@hima_sub@なもり.テスト', username: 'hima_sub', host: 'xn--q9j5bya.xn--zckzah' },
					{ name: 'text' }
				], tokens);
			});

			it('ignore', () => {
				const tokens = analyze('idolm@ster');
				assert.deepEqual([
					{ name: 'text' }
				], tokens);

				const tokens2 = analyze('@a\n@b\n@c');
				assert.deepEqual([
					{ name: 'mention', canonical: '@a', username: 'a', host: null },
					{ name: 'text' },
					{ name: 'mention', canonical: '@b', username: 'b', host: null },
					{ name: 'text' },
					{ name: 'mention', canonical: '@c', username: 'c', host: null }
				], tokens2);

				const tokens3 = analyze('**x**@a');
				assert.deepEqual([
					{ name: 'bold', bold: 'x' },
					{ name: 'mention', canonical: '@a', username: 'a', host: null }
				], tokens3);
			});
		});

		it('hashtag', () => {
			const tokens1 = analyze('Strawberry Pasta #alice');
			assert.deepEqual([
				{ name: 'text' },
				{ name: 'hashtag', hashtag: 'alice' }
			], tokens1);

			const tokens2 = analyze('Foo #bar, baz #piyo.');
			assert.deepEqual([
				{ name: 'text' },
				{ name: 'hashtag', hashtag: 'bar' },
				{ name: 'text' },
				{ name: 'hashtag', hashtag: 'piyo' },
				{ name: 'text' }
			], tokens2);

			const tokens3 = analyze('#Foo!');
			assert.deepEqual([
				{ name: 'hashtag', hashtag: 'Foo' },
				{ name: 'text' },
			], tokens3);
		});

		describe('quote', () => {
			it('basic', () => {
				const tokens1 = analyze('> foo\nbar\nbaz');
				assert.deepEqual([
					{ name: 'quote', quote: 'foo\nbar\nbaz' }
				], tokens1);

				const tokens2 = analyze('before\n> foo\nbar\nbaz\n\nafter');
				assert.deepEqual([
					{ name: 'text' },
					{ name: 'quote', quote: 'foo\nbar\nbaz' },
					{ name: 'text' }
				], tokens2);

				const tokens3 = analyze('piyo> foo\nbar\nbaz');
				assert.deepEqual([
					{ name: 'text' }
				], tokens3);

				const tokens4 = analyze('> foo\n> bar\n> baz');
				assert.deepEqual([
					{ name: 'quote', quote: 'foo\nbar\nbaz' }
				], tokens4);

				const tokens5 = analyze('"\nfoo\nbar\nbaz\n"');
				assert.deepEqual([
					{ name: 'quote', quote: 'foo\nbar\nbaz' }
				], tokens5);
			});

			it('nested', () => {
				const tokens = analyze('>> foo\n> bar');
				assert.deepEqual([{
					name: 'quote',
					children: [{
						name: 'quote',
						children: [{
							name: 'text',
							text: 'foo'
						}]
					}, {
						name: 'text',
						text: 'bar'
					}]
				}], tokens);
			});
		});

		describe('url', () => {
			it('simple', () => {
				const tokens = analyze('https://example.com');
				assert.deepEqual([{
					name: 'url',
					content: 'https://example.com',
					url: 'https://example.com'
				}], tokens);
			});

			it('ignore trailing period', () => {
				const tokens = analyze('https://example.com.');
				assert.deepEqual([{
					name: 'url',
					content: 'https://example.com',
					url: 'https://example.com'
				}, {
					name: 'text'
				}], tokens);
			});

			it('with comma', () => {
				const tokens = analyze('https://example.com/foo?bar=a,b');
				assert.deepEqual([{
					name: 'url',
					content: 'https://example.com/foo?bar=a,b',
					url: 'https://example.com/foo?bar=a,b'
				}], tokens);
			});

			it('ignore trailing comma', () => {
				const tokens = analyze('https://example.com/foo, bar');
				assert.deepEqual([{
					name: 'url',
					content: 'https://example.com/foo',
					url: 'https://example.com/foo'
				}, {
					name: 'text'
				}], tokens);
			});

			it('with brackets', () => {
				const tokens = analyze('https://example.com/foo(bar)');
				assert.deepEqual([{
					name: 'url',
					content: 'https://example.com/foo(bar)',
					url: 'https://example.com/foo(bar)'
				}], tokens);
			});

			it('ignore parent brackets', () => {
				const tokens = analyze('(https://example.com/foo)');
				assert.deepEqual([{
					name: 'text'
				}, {
					name: 'url',
					content: 'https://example.com/foo',
					url: 'https://example.com/foo'
				}, {
					name: 'text'
				}], tokens);
			});

			it('ignore parent brackets with internal brackets', () => {
				const tokens = analyze('(https://example.com/foo(bar))');
				assert.deepEqual([{
					name: 'text'
				}, {
					name: 'url',
					content: 'https://example.com/foo(bar)',
					url: 'https://example.com/foo(bar)'
				}, {
					name: 'text'
				}], tokens);
			});
		});

		it('link', () => {
			const tokens = analyze('[ひまさく](https://himasaku.net)');
			assert.deepEqual([{
				name: 'link',
				content: '[ひまさく](https://himasaku.net)',
				title: 'ひまさく',
				url: 'https://himasaku.net',
				silent: false
			}], tokens);
		});

		it('emoji', () => {
			const tokens1 = analyze(':cat:');
			assert.deepEqual([
				{ name: 'emoji', name: 'cat' }
			], tokens1);

			const tokens2 = analyze(':cat::cat::cat:');
			assert.deepEqual([
				{ name: 'emoji', name: 'cat' },
				{ name: 'emoji', name: 'cat' },
				{ name: 'emoji', name: 'cat' }
			], tokens2);

			const tokens3 = analyze('🍎');
			assert.deepEqual([
				{ name: 'emoji', emoji: '🍎' }
			], tokens3);
		});

		it('block code', () => {
			const tokens = analyze('```\nvar x = "Strawberry Pasta";\n```');
			assert.equal(tokens[0].type, 'code');
			assert.equal(tokens[0].content, '```\nvar x = "Strawberry Pasta";\n```');
		});

		it('inline code', () => {
			const tokens = analyze('`var x = "Strawberry Pasta";`');
			assert.equal(tokens[0].type, 'inline-code');
			assert.equal(tokens[0].content, '`var x = "Strawberry Pasta";`');
		});

		it('math', () => {
			const fomula = 'x = {-b \\pm \\sqrt{b^2-4ac} \\over 2a}';
			const text = `\\(${fomula}\\)`;
			const tokens = analyze(text);
			assert.deepEqual([
				{ name: 'math', content: text, formula: fomula }
			], tokens);
		});

		it('search', () => {
			const tokens1 = analyze('a b c 検索');
			assert.deepEqual([
				{ name: 'search', query: 'a b c' }
			], tokens1);

			const tokens2 = analyze('a b c Search');
			assert.deepEqual([
				{ name: 'search', query: 'a b c' }
			], tokens2);

			const tokens3 = analyze('a b c search');
			assert.deepEqual([
				{ name: 'search', query: 'a b c' }
			], tokens3);

			const tokens4 = analyze('a b c SEARCH');
			assert.deepEqual([
				{ name: 'search', query: 'a b c' }
			], tokens4);
		});

		it('title', () => {
			const tokens1 = analyze('【yee】\nhaw');
			assert.deepEqual(
				{ name: 'title', title: 'yee' }
				, tokens1[0]);

			const tokens2 = analyze('[yee]\nhaw');
			assert.deepEqual(
				{ name: 'title', title: 'yee' }
				, tokens2[0]);

			const tokens3 = analyze('a [a]\nb [b]\nc [c]');
			assert.deepEqual(
				{ name: 'text' }
				, tokens3[0]);

			const tokens4 = analyze('foo\n【bar】\nbuzz');
			assert.deepEqual([
				{ name: 'text' },
				{ name: 'title', title: 'bar' },
				{ name: 'text' },
			], tokens4);
		});
	});

	describe('toHtml', () => {
		it('br', () => {
			const input = 'foo\nbar\nbaz';
			const output = '<p>foo<br>bar<br>baz</p>';
			assert.equal(toHtml(analyze(input)), output);
		});
	});
});
