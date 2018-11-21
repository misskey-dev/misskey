/*
 * Tests of MFM
 */

import * as assert from 'assert';

import analyze from '../src/mfm/parse';
import toHtml from '../src/mfm/html';

function _node(name: string, children: any[], props: any) {
	return children ? { name, children, props } : { name, props };
}

function node(name: string, props?: any) {
	return _node(name, null, props);
}

function nodeWithChildren(name: string, children: any[], props?: any) {
	return _node(name, children, props);
}

function text(text: string) {
	return node('text', { text });
}

describe('Text', () => {
	it('can be analyzed', () => {
		const tokens = analyze('@himawari @hima_sub@namori.net お腹ペコい :cat: #yryr');
		assert.deepEqual([
			node('mention', { acct: '@himawari', canonical: '@himawari', username: 'himawari', host: null }),
			text(' '),
			node('mention', { acct: '@hima_sub@namori.net', canonical: '@hima_sub@namori.net', username: 'hima_sub', host: 'namori.net' }),
			text(' お腹ペコい '),
			node('emoji', { name: 'cat' }),
			text(' '),
			node('hashtag', { hashtag: 'yryr' }),
		], tokens);
	});

	describe('elements', () => {
		describe('bold', () => {
			it('simple', () => {
				const tokens = analyze('**foo**');
				assert.deepEqual([
					nodeWithChildren('bold', [
						text('foo')
					]),
				], tokens);
			});

			it('with other texts', () => {
				const tokens = analyze('bar**foo**bar');
				assert.deepEqual([
					text('bar'),
					nodeWithChildren('bold', [
						text('foo')
					]),
					text('bar'),
				], tokens);
			});
		});

		it('big', () => {
			const tokens = analyze('***Strawberry*** Pasta');
			assert.deepEqual([
				nodeWithChildren('big', [
					text('Strawberry')
				]),
				text(' Pasta'),
			], tokens);
		});

		describe('motion', () => {
			it('by triple brackets', () => {
				const tokens = analyze('(((foo)))');
				assert.deepEqual([
					nodeWithChildren('motion', [
						text('foo')
					]),
				], tokens);
			});

			it('by triple brackets (with other texts)', () => {
				const tokens = analyze('bar(((foo)))bar');
				assert.deepEqual([
					text('bar'),
					nodeWithChildren('motion', [
						text('foo')
					]),
					text('bar'),
				], tokens);
			});

			it('by <motion> tag', () => {
				const tokens = analyze('<motion>foo</motion>');
				assert.deepEqual([
					nodeWithChildren('motion', [
						text('foo')
					]),
				], tokens);
			});

			it('by <motion> tag (with other texts)', () => {
				const tokens = analyze('bar<motion>foo</motion>bar');
				assert.deepEqual([
					text('bar'),
					nodeWithChildren('motion', [
						text('foo')
					]),
					text('bar'),
				], tokens);
			});
		});

		describe('mention', () => {
			it('local', () => {
				const tokens = analyze('@himawari foo');
				assert.deepEqual([
					node('mention', { acct: '@himawari', canonical: '@himawari', username: 'himawari', host: null }),
					text(' foo')
				], tokens);
			});

			it('remote', () => {
				const tokens = analyze('@hima_sub@namori.net foo');
				assert.deepEqual([
					node('mention', { acct: '@hima_sub@namori.net', canonical: '@hima_sub@namori.net', username: 'hima_sub', host: 'namori.net' }),
					text(' foo')
				], tokens);
			});

			it('remote punycode', () => {
				const tokens = analyze('@hima_sub@xn--q9j5bya.xn--zckzah foo');
				assert.deepEqual([
					node('mention', { acct: '@hima_sub@xn--q9j5bya.xn--zckzah', canonical: '@hima_sub@なもり.テスト', username: 'hima_sub', host: 'xn--q9j5bya.xn--zckzah' }),
					text(' foo')
				], tokens);
			});

			it('ignore', () => {
				const tokens = analyze('idolm@ster');
				assert.deepEqual([
					text('idolm@ster')
				], tokens);

				const tokens2 = analyze('@a\n@b\n@c');
				assert.deepEqual([
					node('mention', { acct: '@a', canonical: '@a', username: 'a', host: null }),
					text('\n'),
					node('mention', { acct: '@b', canonical: '@b', username: 'b', host: null }),
					text('\n'),
					node('mention', { acct: '@c', canonical: '@c', username: 'c', host: null })
				], tokens2);

				const tokens3 = analyze('**x**@a');
				assert.deepEqual([
					nodeWithChildren('bold', [
						text('x')
					]),
					node('mention', { acct: '@a', canonical: '@a', username: 'a', host: null })
				], tokens3);
			});
		});

		describe('hashtag', () => {
			it('simple', () => {
				const tokens = analyze('#alice');
				assert.deepEqual([
					node('hashtag', { hashtag: 'alice' })
				], tokens);
			});

			it('after line break', () => {
				const tokens = analyze('foo\n#alice');
				assert.deepEqual([
					text('foo\n'),
					node('hashtag', { hashtag: 'alice' })
				], tokens);
			});

			it('with text', () => {
				const tokens = analyze('Strawberry Pasta #alice');
				assert.deepEqual([
					text('Strawberry Pasta '),
					node('hashtag', { hashtag: 'alice' })
				], tokens);
			});

			it('ignore comma and period', () => {
				const tokens = analyze('Foo #bar, baz #piyo.');
				assert.deepEqual([
					text('Foo '),
					node('hashtag', { hashtag: 'bar' }),
					text(', baz '),
					node('hashtag', { hashtag: 'piyo' }),
					text('.'),
				], tokens);
			});

			it('ignore exclamation mark', () => {
				const tokens = analyze('#Foo!');
				assert.deepEqual([
					node('hashtag', { hashtag: 'Foo' }),
					text('!'),
				], tokens);
			});
		});

		describe('quote', () => {
			it('basic', () => {
				const tokens1 = analyze('> foo');
				assert.deepEqual([
					nodeWithChildren('quote', [
						text('foo')
					])
				], tokens1);

				const tokens2 = analyze('>foo');
				assert.deepEqual([
					nodeWithChildren('quote', [
						text('foo')
					])
				], tokens2);
			});

			it('series', () => {
				const tokens = analyze('> foo\n\n> bar');
				assert.deepEqual([
					nodeWithChildren('quote', [
						text('foo')
					]),
					nodeWithChildren('quote', [
						text('bar')
					]),
				], tokens);
			});

			it('trailing line break', () => {
				const tokens1 = analyze('> foo\n');
				assert.deepEqual([
					nodeWithChildren('quote', [
						text('foo')
					]),
				], tokens1);

				const tokens2 = analyze('> foo\n\n');
				assert.deepEqual([
					nodeWithChildren('quote', [
						text('foo')
					]),
					text('\n')
				], tokens2);
			});

			it('multiline', () => {
				const tokens1 = analyze('>foo\n>bar');
				assert.deepEqual([
					nodeWithChildren('quote', [
						text('foo\nbar')
					])
				], tokens1);

				const tokens2 = analyze('> foo\n> bar');
				assert.deepEqual([
					nodeWithChildren('quote', [
						text('foo\nbar')
					])
				], tokens2);
			});

			it('multiline with trailing line break', () => {
				const tokens1 = analyze('> foo\n> bar\n');
				assert.deepEqual([
					nodeWithChildren('quote', [
						text('foo\nbar')
					]),
				], tokens1);

				const tokens2 = analyze('> foo\n> bar\n\n');
				assert.deepEqual([
					nodeWithChildren('quote', [
						text('foo\nbar')
					]),
					text('\n')
				], tokens2);
			});

			it('with before and after texts', () => {
				const tokens = analyze('before\n> foo\nafter');
				assert.deepEqual([
					text('before'),
					nodeWithChildren('quote', [
						text('foo')
					]),
					text('after'),
				], tokens);
			});

			it('require line break before ">"', () => {
				const tokens = analyze('foo>bar');
				assert.deepEqual([
					text('foo>bar'),
				], tokens);
			});

			it('nested', () => {
				const tokens = analyze('>> foo\n> bar');
				assert.deepEqual([
					nodeWithChildren('quote', [
						nodeWithChildren('quote', [
							text('foo')
						]),
						text('bar')
					])
				], tokens);
			});

			it('trim line breaks', () => {
				const tokens = analyze('foo\n\n>a\n>>b\n>>\n>>>\n>>>c\n>>>\n>d\n\n');
				assert.deepEqual([
					text('foo\n'),
					nodeWithChildren('quote', [
						text('a'),
						nodeWithChildren('quote', [
							text('b\n'),
							nodeWithChildren('quote', [
								text('\nc\n')
							])
						]),
						text('d')
					]),
					text('\n'),
				], tokens);
			});
		});

		describe('url', () => {
			it('simple', () => {
				const tokens = analyze('https://example.com');
				assert.deepEqual([
					node('url', { url: 'https://example.com' })
				], tokens);
			});

			it('ignore trailing period', () => {
				const tokens = analyze('https://example.com.');
				assert.deepEqual([
					node('url', { url: 'https://example.com' }),
					text('.')
				], tokens);
			});

			it('with comma', () => {
				const tokens = analyze('https://example.com/foo?bar=a,b');
				assert.deepEqual([
					node('url', { url: 'https://example.com/foo?bar=a,b' })
				], tokens);
			});

			it('ignore trailing comma', () => {
				const tokens = analyze('https://example.com/foo, bar');
				assert.deepEqual([
					node('url', { url: 'https://example.com/foo' }),
					text(', bar')
				], tokens);
			});

			it('with brackets', () => {
				const tokens = analyze('https://example.com/foo(bar)');
				assert.deepEqual([
					node('url', { url: 'https://example.com/foo(bar)' })
				], tokens);
			});

			it('ignore parent brackets', () => {
				const tokens = analyze('(https://example.com/foo)');
				assert.deepEqual([
					text('('),
					node('url', { url: 'https://example.com/foo' }),
					text(')')
				], tokens);
			});

			it('ignore parent brackets 2', () => {
				const tokens = analyze('(foo https://example.com/foo)');
				assert.deepEqual([
					text('(foo '),
					node('url', { url: 'https://example.com/foo' }),
					text(')')
				], tokens);
			});

			it('ignore parent brackets with internal brackets', () => {
				const tokens = analyze('(https://example.com/foo(bar))');
				assert.deepEqual([
					text('('),
					node('url', { url: 'https://example.com/foo(bar)' }),
					text(')')
				], tokens);
			});
		});

		describe('link', () => {
			it('simple', () => {
				const tokens = analyze('[foo](https://example.com)');
				assert.deepEqual([
					nodeWithChildren('link', [
						text('foo')
					], { url: 'https://example.com', silent: false })
				], tokens);
			});

			it('in text', () => {
				const tokens = analyze('before[foo](https://example.com)after');
				assert.deepEqual([
					text('before'),
					nodeWithChildren('link', [
						text('foo')
					], { url: 'https://example.com', silent: false }),
					text('after'),
				], tokens);
			});
		});

		it('emoji', () => {
			const tokens1 = analyze(':cat:');
			assert.deepEqual([
				node('emoji', { name: 'cat' })
			], tokens1);

			const tokens2 = analyze(':cat::cat::cat:');
			assert.deepEqual([
				node('emoji', { name: 'cat' }),
				node('emoji', { name: 'cat' }),
				node('emoji', { name: 'cat' })
			], tokens2);

			const tokens3 = analyze('🍎');
			assert.deepEqual([
				node('emoji', { emoji: '🍎' })
			], tokens3);
		});

		describe('block code', () => {
			it('simple', () => {
				const tokens = analyze('```\nvar x = "Strawberry Pasta";\n```');
				assert.deepEqual([
					node('blockCode', { code: 'var x = "Strawberry Pasta";', lang: null })
				], tokens);
			});

			it('can specify language', () => {
				const tokens = analyze('``` json\n{ "x": 42 }\n```');
				assert.deepEqual([
					node('blockCode', { code: '{ "x": 42 }', lang: 'json' })
				], tokens);
			});

			it('require line break before "```"', () => {
				const tokens = analyze('before```\nfoo\n```');
				assert.deepEqual([
					text('before'),
					node('inlineCode', { code: '`' }),
					text('\nfoo\n'),
					node('inlineCode', { code: '`' })
				], tokens);
			});

			it('series', () => {
				const tokens = analyze('```\nfoo\n```\n```\nbar\n```\n```\nbaz\n```');
				assert.deepEqual([
					node('blockCode', { code: 'foo', lang: null }),
					node('blockCode', { code: 'bar', lang: null }),
					node('blockCode', { code: 'baz', lang: null }),
				], tokens);
			});

			it('ignore internal marker', () => {
				const tokens = analyze('```\naaa```bbb\n```');
				assert.deepEqual([
					node('blockCode', { code: 'aaa```bbb', lang: null })
				], tokens);
			});

			it('trim after line break', () => {
				const tokens = analyze('```\nfoo\n```\nbar');
				assert.deepEqual([
					node('blockCode', { code: 'foo', lang: null }),
					text('bar')
				], tokens);
			});
		});

		describe('inline code', () => {
			it('simple', () => {
				const tokens = analyze('`var x = "Strawberry Pasta";`');
				assert.deepEqual([
					node('inlineCode', { code: 'var x = "Strawberry Pasta";' })
				], tokens);
			});

			it('disallow line break', () => {
				const tokens = analyze('`foo\nbar`');
				assert.deepEqual([
					text('`foo\nbar`')
				], tokens);
			});

			it('disallow ´', () => {
				const tokens = analyze('`foo´bar`');
				assert.deepEqual([
					text('`foo´bar`')
				], tokens);
			});
		});

		it('math', () => {
			const fomula = 'x = {-b \\pm \\sqrt{b^2-4ac} \\over 2a}';
			const text = `\\(${fomula}\\)`;
			const tokens = analyze(text);
			assert.deepEqual([
				node('math', { formula: fomula })
			], tokens);
		});

		it('search', () => {
			const tokens1 = analyze('a b c 検索');
			assert.deepEqual([
				node('search', { content: 'a b c 検索', query: 'a b c' })
			], tokens1);

			const tokens2 = analyze('a b c Search');
			assert.deepEqual([
				node('search', { content: 'a b c Search', query: 'a b c' })
			], tokens2);

			const tokens3 = analyze('a b c search');
			assert.deepEqual([
				node('search', { content: 'a b c search', query: 'a b c' })
			], tokens3);

			const tokens4 = analyze('a b c SEARCH');
			assert.deepEqual([
				node('search', { content: 'a b c SEARCH', query: 'a b c' })
			], tokens4);
		});

		describe('title', () => {
			it('simple', () => {
				const tokens = analyze('【foo】');
				assert.deepEqual([
					nodeWithChildren('title', [
						text('foo')
					])
				], tokens);
			});

			it('require line break', () => {
				const tokens = analyze('a【foo】');
				assert.deepEqual([
					text('a【foo】')
				], tokens);
			});

			it('with before and after texts', () => {
				const tokens = analyze('before\n【foo】\nafter');
				assert.deepEqual([
					text('before'),
					nodeWithChildren('title', [
						text('foo')
					]),
					text('after')
				], tokens);
			});
		});
	});

	describe('toHtml', () => {
		it('br', () => {
			const input = 'foo\nbar\nbaz';
			const output = '<p><span>foo<br>bar<br>baz</span></p>';
			assert.equal(toHtml(analyze(input)), output);
		});
	});

	it('code block with quote', () => {
		const tokens = analyze('> foo\n```\nbar\n```');
		assert.deepEqual([
			nodeWithChildren('quote', [
				text('foo')
			]),
			node('blockCode', { code: 'bar', lang: null })
		], tokens);
	});

	it('quote between two code blocks', () => {
		const tokens = analyze('```\nbefore\n```\n> foo\n```\nafter\n```');
		assert.deepEqual([
			node('blockCode', { code: 'before', lang: null }),
			nodeWithChildren('quote', [
				text('foo')
			]),
			node('blockCode', { code: 'after', lang: null })
		], tokens);
	});
});
