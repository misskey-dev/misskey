/*
 * Tests of MFM
 */

import * as assert from 'assert';

import analyze from '../src/mfm/parse';
import toHtml from '../src/mfm/html';

function _node(name: string, children: any[], props: any) {
	return { name, children, props };
}

function node(name: string, props?: any) {
	return _node(name, null, props);
}

function nodeWithChildren(name: string, children: any[], props?: any) {
	return _node(name, children, props);
}

describe('Text', () => {
	it('can be analyzed', () => {
		const tokens = analyze('@himawari @hima_sub@namori.net お腹ペコい :cat: #yryr');
		assert.deepEqual([
			node('mention', { canonical: '@himawari', username: 'himawari', host: null }),
			node('text', { text: ' ' }),
			node('mention', { canonical: '@hima_sub@namori.net', username: 'hima_sub', host: 'namori.net' }),
			node('text', { text: ' ' }),
			node('emoji', { name: 'cat' }),
			node('text', { text: ' ' }),
			node('hashtag', { hashtag: 'yryr' }),
		], tokens);
	});

	describe('elements', () => {
		it('bold', () => {
			const tokens = analyze('**Strawberry** Pasta');
			assert.deepEqual([
				nodeWithChildren('bold', [
					node('text', { text: 'Strawberry' })
				]),
				node('text', { text: ' Pasta' }),
			], tokens);
		});

		it('big', () => {
			const tokens = analyze('***Strawberry*** Pasta');
			assert.deepEqual([
				nodeWithChildren('big', [
					node('text', { text: 'Strawberry' })
				]),
				node('text', { text: ' Pasta' }),
			], tokens);
		});

		it('motion', () => {
			const tokens1 = analyze('(((Strawberry))) Pasta');
			assert.deepEqual([
				nodeWithChildren('motion', [
					node('text', { text: 'Strawberry' })
				]),
				node('text', { text: ' Pasta' }),
			], tokens1);

			const tokens2 = analyze('<motion>Strawberry</motion> Pasta');
			assert.deepEqual([
				nodeWithChildren('motion', [
					node('text', { text: 'Strawberry' })
				]),
				node('text', { text: ' Pasta' }),
			], tokens2);
		});

		describe('mention', () => {
			it('local', () => {
				const tokens = analyze('@himawari foo');
				assert.deepEqual([
					node('mention', { canonical: '@himawari', username: 'himawari', host: null }),
					node('text', { text: ' foo' })
				], tokens);
			});

			it('remote', () => {
				const tokens = analyze('@hima_sub@namori.net foo');
				assert.deepEqual([
					node('mention', { canonical: '@hima_sub@namori.net', username: 'hima_sub', host: 'namori.net' }),
					node('text', { text: ' foo' })
				], tokens);
			});

			it('remote punycode', () => {
				const tokens = analyze('@hima_sub@xn--q9j5bya.xn--zckzah foo');
				assert.deepEqual([
					node('mention', { canonical: '@hima_sub@なもり.テスト', username: 'hima_sub', host: 'xn--q9j5bya.xn--zckzah' }),
					node('text', { text: ' foo' })
				], tokens);
			});

			it('ignore', () => {
				const tokens = analyze('idolm@ster');
				assert.deepEqual([
					node('text', { text: 'idolm@ster' })
				], tokens);

				const tokens2 = analyze('@a\n@b\n@c');
				assert.deepEqual([
					node('mention', { canonical: '@a', username: 'a', host: null }),
					node('text', { text: '\n' }),
					node('mention', { canonical: '@b', username: 'b', host: null }),
					node('text', { text: '\n' }),
					node('mention', { canonical: '@c', username: 'c', host: null })
				], tokens2);

				const tokens3 = analyze('**x**@a');
				assert.deepEqual([
					node('bold', [
						node('text', { text: 'x' })
					]),
					node('mention', { canonical: '@a', username: 'a', host: null })
				], tokens3);
			});
		});

		it('hashtag', () => {
			const tokens1 = analyze('Strawberry Pasta #alice');
			assert.deepEqual([
				node('text', { text: 'Strawberry Pasta ' }),
				node('hashtag', { hashtag: 'alice' })
			], tokens1);

			const tokens2 = analyze('Foo #bar, baz #piyo.');
			assert.deepEqual([
				node('text', { text: 'Foo ' }),
				node('hashtag', { hashtag: 'bar' })
				node('text', { text: ', baz ' }),
				node('hashtag', { hashtag: 'piyo' })
				node('text', { text: '.' }),
			], tokens2);

			const tokens3 = analyze('#Foo!');
			assert.deepEqual([
				node('hashtag', { hashtag: 'Foo' })
				node('text', { text: '!' }),
			], tokens3);
		});

		describe('quote', () => {
			it('basic', () => {
				const tokens1 = analyze('> foo\nbar\nbaz');
				assert.deepEqual([
					nodeWithChildren('quote', [
						node('text', { text: 'foo\nbar\nbaz' })
					])
				], tokens1);

				const tokens2 = analyze('before\n> foo\nbar\nbaz\n\nafter');
				assert.deepEqual([
					node('text', { text: 'before\n' }),
					nodeWithChildren('quote', [
						node('text', { text: 'foo\nbar\nbaz' })
					]),
					node('text', { text: '\nafter' })
				], tokens2);

				const tokens3 = analyze('piyo> foo\nbar\nbaz');
				assert.deepEqual([
					node('text', { text: 'piyo> foo\nbar\nbaz' })
				], tokens3);

				const tokens4 = analyze('> foo\n> bar\n> baz');
				assert.deepEqual([
					nodeWithChildren('quote', [
						node('text', { text: 'foo\nbar\nbaz' })
					])
				], tokens4);

				const tokens5 = analyze('"\nfoo\nbar\nbaz\n"');
				assert.deepEqual([
					nodeWithChildren('quote', [
						node('text', { text: 'foo\nbar\nbaz' })
					])
				], tokens5);
			});

			it('nested', () => {
				const tokens = analyze('>> foo\n> bar');
				assert.deepEqual([
					nodeWithChildren('quote', [
						nodeWithChildren('quote', [
							node('text', { text: 'foo' })
						]),
						node('text', { text: 'bar' })
					])
				], tokens);
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
				node('emoji', name: 'cat' }
			], tokens1);

			const tokens2 = analyze(':cat::cat::cat:');
			assert.deepEqual([
				node('emoji', name: 'cat' },
				node('emoji', name: 'cat' },
				node('emoji', name: 'cat' }
			], tokens2);

			const tokens3 = analyze('🍎');
			assert.deepEqual([
				node('emoji', emoji: '🍎' }
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
				node('math', content: text, formula: fomula }
			], tokens);
		});

		it('search', () => {
			const tokens1 = analyze('a b c 検索');
			assert.deepEqual([
				node('search', query: 'a b c' }
			], tokens1);

			const tokens2 = analyze('a b c Search');
			assert.deepEqual([
				node('search', query: 'a b c' }
			], tokens2);

			const tokens3 = analyze('a b c search');
			assert.deepEqual([
				node('search', query: 'a b c' }
			], tokens3);

			const tokens4 = analyze('a b c SEARCH');
			assert.deepEqual([
				node('search', query: 'a b c' }
			], tokens4);
		});

		it('title', () => {
			const tokens1 = analyze('【yee】\nhaw');
			assert.deepEqual(
				node('title', title: 'yee' }
				, tokens1[0]);

			const tokens2 = analyze('[yee]\nhaw');
			assert.deepEqual(
				node('title', title: 'yee' }
				, tokens2[0]);

			const tokens3 = analyze('a [a]\nb [b]\nc [c]');
			assert.deepEqual(
				node('text' }
				, tokens3[0]);

			const tokens4 = analyze('foo\n【bar】\nbuzz');
			assert.deepEqual([
				node('text' },
				node('title', title: 'bar' },
				node('text' },
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
