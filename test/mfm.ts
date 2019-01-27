/*
 * Tests of MFM
 *
 * How to run the tests:
 * > mocha test/mfm.ts --require ts-node/register
 *
 * To specify test:
 * > mocha test/mfm.ts --require ts-node/register -g 'test name'
 */

import * as assert from 'assert';

import analyze from '../src/mfm/parse';
import toHtml from '../src/mfm/html';
import { createTree as tree, createLeaf as leaf, MfmTree, removeOrphanedBrackets } from '../src/mfm/parser';

function text(text: string): MfmTree {
	return leaf('text', { text });
}

describe('createLeaf', () => {
	it('creates leaf', () => {
		assert.deepStrictEqual(leaf('text', { text: 'abc' }), {
			node: {
				type: 'text',
				props: {
					text: 'abc'
				}
			},
			children: [],
		});
	});
});

describe('createTree', () => {
	it('creates tree', () => {
		const t = tree('tree', [
			leaf('left', { a: 2 }),
			leaf('right', { b: 'hi' })
		], {
				c: 4
			});
		assert.deepStrictEqual(t, {
			node: {
				type: 'tree',
				props: {
					c: 4
				}
			},
			children: [
				leaf('left', { a: 2 }),
				leaf('right', { b: 'hi' })
			],
		});
	});
});

describe('removeOrphanedBrackets', () => {
	it('single (contained)', () => {
		const input = '(foo)';
		const expected = '(foo)';
		const actual = removeOrphanedBrackets(input);
		assert.deepStrictEqual(actual, expected);
	});

	it('single (head)', () => {
		const input = '(foo)bar';
		const expected = '(foo)bar';
		const actual = removeOrphanedBrackets(input);
		assert.deepStrictEqual(actual, expected);
	});

	it('single (tail)', () => {
		const input = 'foo(bar)';
		const expected = 'foo(bar)';
		const actual = removeOrphanedBrackets(input);
		assert.deepStrictEqual(actual, expected);
	});

	it('a', () => {
		const input = '(foo';
		const expected = '';
		const actual = removeOrphanedBrackets(input);
		assert.deepStrictEqual(actual, expected);
	});

	it('b', () => {
		const input = ')foo';
		const expected = '';
		const actual = removeOrphanedBrackets(input);
		assert.deepStrictEqual(actual, expected);
	});

	it('nested', () => {
		const input = 'foo(「(bar)」)';
		const expected = 'foo(「(bar)」)';
		const actual = removeOrphanedBrackets(input);
		assert.deepStrictEqual(actual, expected);
	});

	it('no brackets', () => {
		const input = 'foo';
		const expected = 'foo';
		const actual = removeOrphanedBrackets(input);
		assert.deepStrictEqual(actual, expected);
	});

	it('with foreign bracket (single)', () => {
		const input = 'foo(bar))';
		const expected = 'foo(bar)';
		const actual = removeOrphanedBrackets(input);
		assert.deepStrictEqual(actual, expected);
	});

	it('with foreign bracket (open)', () => {
		const input = 'foo(bar';
		const expected = 'foo';
		const actual = removeOrphanedBrackets(input);
		assert.deepStrictEqual(actual, expected);
	});

	it('with foreign bracket (close)', () => {
		const input = 'foo)bar';
		const expected = 'foo';
		const actual = removeOrphanedBrackets(input);
		assert.deepStrictEqual(actual, expected);
	});

	it('with foreign bracket (close and open)', () => {
		const input = 'foo)(bar';
		const expected = 'foo';
		const actual = removeOrphanedBrackets(input);
		assert.deepStrictEqual(actual, expected);
	});

	it('various bracket type', () => {
		const input = 'foo「(bar)」(';
		const expected = 'foo「(bar)」';
		const actual = removeOrphanedBrackets(input);
		assert.deepStrictEqual(actual, expected);
	});

	it('intersected', () => {
		const input = 'foo(「)」';
		const expected = 'foo(「)」';
		const actual = removeOrphanedBrackets(input);
		assert.deepStrictEqual(actual, expected);
	});
});

describe('MFM', () => {
	it('can be analyzed', () => {
		const tokens = analyze('@himawari @hima_sub@namori.net お腹ペコい :cat: #yryr');
		assert.deepStrictEqual(tokens, [
			leaf('mention', {
				acct: '@himawari',
				canonical: '@himawari',
				username: 'himawari',
				host: null
			}),
			text(' '),
			leaf('mention', {
				acct: '@hima_sub@namori.net',
				canonical: '@hima_sub@namori.net',
				username: 'hima_sub',
				host: 'namori.net'
			}),
			text(' お腹ペコい '),
			leaf('emoji', { name: 'cat' }),
			text(' '),
			leaf('hashtag', { hashtag: 'yryr' }),
		]);
	});

	describe('elements', () => {
		describe('bold', () => {
			it('simple', () => {
				const tokens = analyze('**foo**');
				assert.deepStrictEqual(tokens, [
					tree('bold', [
						text('foo')
					], {}),
				]);
			});

			it('with other texts', () => {
				const tokens = analyze('bar**foo**bar');
				assert.deepStrictEqual(tokens, [
					text('bar'),
					tree('bold', [
						text('foo')
					], {}),
					text('bar'),
				]);
			});

			it('with underscores', () => {
				const tokens = analyze('__foo__');
				assert.deepStrictEqual(tokens, [
					tree('bold', [
						text('foo')
					], {}),
				]);
			});

			it('with underscores (ensure it allows alphabet only)', () => {
				const tokens = analyze('(=^・__________・^=)');
				assert.deepStrictEqual(tokens, [
					text('(=^・__________・^=)')
				]);
			});

			it('mixed syntax', () => {
				const tokens = analyze('**foo__');
				assert.deepStrictEqual(tokens, [
						text('**foo__'),
				]);
			});

			it('mixed syntax', () => {
				const tokens = analyze('__foo**');
				assert.deepStrictEqual(tokens, [
						text('__foo**'),
				]);
			});
		});

		it('big', () => {
			const tokens = analyze('***Strawberry*** Pasta');
			assert.deepStrictEqual(tokens, [
				tree('big', [
					text('Strawberry')
				], {}),
				text(' Pasta'),
			]);
		});

		it('small', () => {
			const tokens = analyze('<small>smaller</small>');
			assert.deepStrictEqual(tokens, [
				tree('small', [
					text('smaller')
				], {}),
			]);
		});

		it('flip', () => {
			const tokens = analyze('<flip>foo</flip>');
			assert.deepStrictEqual(tokens, [
				tree('flip', [
					text('foo')
				], {}),
			]);
		});

		it('spin', () => {
			const tokens = analyze('<spin>:foo:</spin>');
			assert.deepStrictEqual(tokens, [
				tree('spin', [
					leaf('emoji', { name: 'foo' })
				], {}),
			]);
		});

		describe('motion', () => {
			it('by triple brackets', () => {
				const tokens = analyze('(((foo)))');
				assert.deepStrictEqual(tokens, [
					tree('motion', [
						text('foo')
					], {}),
				]);
			});

			it('by triple brackets (with other texts)', () => {
				const tokens = analyze('bar(((foo)))bar');
				assert.deepStrictEqual(tokens, [
					text('bar'),
					tree('motion', [
						text('foo')
					], {}),
					text('bar'),
				]);
			});

			it('by <motion> tag', () => {
				const tokens = analyze('<motion>foo</motion>');
				assert.deepStrictEqual(tokens, [
					tree('motion', [
						text('foo')
					], {}),
				]);
			});

			it('by <motion> tag (with other texts)', () => {
				const tokens = analyze('bar<motion>foo</motion>bar');
				assert.deepStrictEqual(tokens, [
					text('bar'),
					tree('motion', [
						text('foo')
					], {}),
					text('bar'),
				]);
			});
		});

		describe('mention', () => {
			it('local', () => {
				const tokens = analyze('@himawari foo');
				assert.deepStrictEqual(tokens, [
					leaf('mention', {
						acct: '@himawari',
						canonical: '@himawari',
						username: 'himawari',
						host: null
					}),
					text(' foo')
				]);
			});

			it('remote', () => {
				const tokens = analyze('@hima_sub@namori.net foo');
				assert.deepStrictEqual(tokens, [
					leaf('mention', {
						acct: '@hima_sub@namori.net',
						canonical: '@hima_sub@namori.net',
						username: 'hima_sub',
						host: 'namori.net'
					}),
					text(' foo')
				]);
			});

			it('remote punycode', () => {
				const tokens = analyze('@hima_sub@xn--q9j5bya.xn--zckzah foo');
				assert.deepStrictEqual(tokens, [
					leaf('mention', {
						acct: '@hima_sub@xn--q9j5bya.xn--zckzah',
						canonical: '@hima_sub@なもり.テスト',
						username: 'hima_sub',
						host: 'xn--q9j5bya.xn--zckzah'
					}),
					text(' foo')
				]);
			});

			it('ignore', () => {
				const tokens = analyze('idolm@ster');
				assert.deepStrictEqual(tokens, [
					text('idolm@ster')
				]);

				const tokens2 = analyze('@a\n@b\n@c');
				assert.deepStrictEqual(tokens2, [
					leaf('mention', {
						acct: '@a',
						canonical: '@a',
						username: 'a',
						host: null
					}),
					text('\n'),
					leaf('mention', {
						acct: '@b',
						canonical: '@b',
						username: 'b',
						host: null
					}),
					text('\n'),
					leaf('mention', {
						acct: '@c',
						canonical: '@c',
						username: 'c',
						host: null
					})
				]);

				const tokens3 = analyze('**x**@a');
				assert.deepStrictEqual(tokens3, [
					tree('bold', [
						text('x')
					], {}),
					leaf('mention', {
						acct: '@a',
						canonical: '@a',
						username: 'a',
						host: null
					})
				]);

				const tokens4 = analyze('@\n@v\n@veryverylongusername');
				assert.deepStrictEqual(tokens4, [
					text('@\n'),
					leaf('mention', {
						acct: '@v',
						canonical: '@v',
						username: 'v',
						host: null
					}),
					text('\n'),
					leaf('mention', {
						acct: '@veryverylongusername',
						canonical: '@veryverylongusername',
						username: 'veryverylongusername',
						host: null
					}),
				]);
			});
		});

		describe('hashtag', () => {
			it('simple', () => {
				const tokens = analyze('#alice');
				assert.deepStrictEqual(tokens, [
					leaf('hashtag', { hashtag: 'alice' })
				]);
			});

			it('after line break', () => {
				const tokens = analyze('foo\n#alice');
				assert.deepStrictEqual(tokens, [
					text('foo\n'),
					leaf('hashtag', { hashtag: 'alice' })
				]);
			});

			it('with text', () => {
				const tokens = analyze('Strawberry Pasta #alice');
				assert.deepStrictEqual(tokens, [
					text('Strawberry Pasta '),
					leaf('hashtag', { hashtag: 'alice' })
				]);
			});

			it('with text (zenkaku)', () => {
				const tokens = analyze('こんにちは#世界');
				assert.deepStrictEqual(tokens, [
					text('こんにちは'),
					leaf('hashtag', { hashtag: '世界' })
				]);
			});

			it('ignore comma and period', () => {
				const tokens = analyze('Foo #bar, baz #piyo.');
				assert.deepStrictEqual(tokens, [
					text('Foo '),
					leaf('hashtag', { hashtag: 'bar' }),
					text(', baz '),
					leaf('hashtag', { hashtag: 'piyo' }),
					text('.'),
				]);
			});

			it('ignore exclamation mark', () => {
				const tokens = analyze('#Foo!');
				assert.deepStrictEqual(tokens, [
					leaf('hashtag', { hashtag: 'Foo' }),
					text('!'),
				]);
			});

			it('ignore colon', () => {
				const tokens = analyze('#Foo:');
				assert.deepStrictEqual(tokens, [
					leaf('hashtag', { hashtag: 'Foo' }),
					text(':'),
				]);
			});

			it('ignore single quote', () => {
				const tokens = analyze('#foo\'');
				assert.deepStrictEqual(tokens, [
					leaf('hashtag', { hashtag: 'foo' }),
					text('\''),
				]);
			});

			it('ignore double quote', () => {
				const tokens = analyze('#foo"');
				assert.deepStrictEqual(tokens, [
					leaf('hashtag', { hashtag: 'foo' }),
					text('"'),
				]);
			});

			it('allow including number', () => {
				const tokens = analyze('#foo123');
				assert.deepStrictEqual(tokens, [
					leaf('hashtag', { hashtag: 'foo123' }),
				]);
			});

			it('with brackets', () => {
				const tokens1 = analyze('(#foo)');
				assert.deepStrictEqual(tokens1, [
					text('('),
					leaf('hashtag', { hashtag: 'foo' }),
					text(')'),
				]);

				const tokens2 = analyze('「#foo」');
				assert.deepStrictEqual(tokens2, [
					text('「'),
					leaf('hashtag', { hashtag: 'foo' }),
					text('」'),
				]);
			});

			it('with mixed brackets', () => {
				const tokens = analyze('「#foo(bar)」');
				assert.deepStrictEqual(tokens, [
					text('「'),
					leaf('hashtag', { hashtag: 'foo(bar)' }),
					text('」'),
				]);
			});

			it('with brackets (space before)', () => {
				const tokens1 = analyze('(bar #foo)');
				assert.deepStrictEqual(tokens1, [
					text('(bar '),
					leaf('hashtag', { hashtag: 'foo' }),
					text(')'),
				]);

				const tokens2 = analyze('「bar #foo」');
				assert.deepStrictEqual(tokens2, [
					text('「bar '),
					leaf('hashtag', { hashtag: 'foo' }),
					text('」'),
				]);
			});

			it('disallow number only', () => {
				const tokens = analyze('#123');
				assert.deepStrictEqual(tokens, [
					text('#123'),
				]);
			});

			it('disallow number only (with brackets)', () => {
				const tokens = analyze('(#123)');
				assert.deepStrictEqual(tokens, [
					text('(#123)'),
				]);
			});
		});

		describe('quote', () => {
			it('basic', () => {
				const tokens1 = analyze('> foo');
				assert.deepStrictEqual(tokens1, [
					tree('quote', [
						text('foo')
					], {})
				]);

				const tokens2 = analyze('>foo');
				assert.deepStrictEqual(tokens2, [
					tree('quote', [
						text('foo')
					], {})
				]);
			});

			it('series', () => {
				const tokens = analyze('> foo\n\n> bar');
				assert.deepStrictEqual(tokens, [
					tree('quote', [
						text('foo')
					], {}),
					text('\n'),
					tree('quote', [
						text('bar')
					], {}),
				]);
			});

			it('trailing line break', () => {
				const tokens1 = analyze('> foo\n');
				assert.deepStrictEqual(tokens1, [
					tree('quote', [
						text('foo')
					], {}),
				]);

				const tokens2 = analyze('> foo\n\n');
				assert.deepStrictEqual(tokens2, [
					tree('quote', [
						text('foo')
					], {}),
					text('\n')
				]);
			});

			it('multiline', () => {
				const tokens1 = analyze('>foo\n>bar');
				assert.deepStrictEqual(tokens1, [
					tree('quote', [
						text('foo\nbar')
					], {})
				]);

				const tokens2 = analyze('> foo\n> bar');
				assert.deepStrictEqual(tokens2, [
					tree('quote', [
						text('foo\nbar')
					], {})
				]);
			});

			it('multiline with trailing line break', () => {
				const tokens1 = analyze('> foo\n> bar\n');
				assert.deepStrictEqual(tokens1, [
					tree('quote', [
						text('foo\nbar')
					], {}),
				]);

				const tokens2 = analyze('> foo\n> bar\n\n');
				assert.deepStrictEqual(tokens2, [
					tree('quote', [
						text('foo\nbar')
					], {}),
					text('\n')
				]);
			});

			it('with before and after texts', () => {
				const tokens = analyze('before\n> foo\nafter');
				assert.deepStrictEqual(tokens, [
					text('before\n'),
					tree('quote', [
						text('foo')
					], {}),
					text('after'),
				]);
			});

			it('multiple quotes', () => {
				const tokens = analyze('> foo\nbar\n\n> foo\nbar\n\n> foo\nbar');
				assert.deepStrictEqual(tokens, [
					tree('quote', [
						text('foo')
					], {}),
					text('bar\n\n'),
					tree('quote', [
						text('foo')
					], {}),
					text('bar\n\n'),
					tree('quote', [
						text('foo')
					], {}),
					text('bar'),
				]);
			});

			it('require line break before ">"', () => {
				const tokens = analyze('foo>bar');
				assert.deepStrictEqual(tokens, [
					text('foo>bar'),
				]);
			});

			it('nested', () => {
				const tokens = analyze('>> foo\n> bar');
				assert.deepStrictEqual(tokens, [
					tree('quote', [
						tree('quote', [
							text('foo')
						], {}),
						text('bar')
					], {})
				]);
			});

			it('trim line breaks', () => {
				const tokens = analyze('foo\n\n>a\n>>b\n>>\n>>>\n>>>c\n>>>\n>d\n\n');
				assert.deepStrictEqual(tokens, [
					text('foo\n\n'),
					tree('quote', [
						text('a\n'),
						tree('quote', [
							text('b\n\n'),
							tree('quote', [
								text('\nc\n')
							], {})
						], {}),
						text('d')
					], {}),
					text('\n'),
				]);
			});
		});

		describe('url', () => {
			it('simple', () => {
				const tokens = analyze('https://example.com');
				assert.deepStrictEqual(tokens, [
					leaf('url', { url: 'https://example.com' })
				]);
			});

			it('ignore trailing period', () => {
				const tokens = analyze('https://example.com.');
				assert.deepStrictEqual(tokens, [
					leaf('url', { url: 'https://example.com' }),
					text('.')
				]);
			});

			it('with comma', () => {
				const tokens = analyze('https://example.com/foo?bar=a,b');
				assert.deepStrictEqual(tokens, [
					leaf('url', { url: 'https://example.com/foo?bar=a,b' })
				]);
			});

			it('ignore trailing comma', () => {
				const tokens = analyze('https://example.com/foo, bar');
				assert.deepStrictEqual(tokens, [
					leaf('url', { url: 'https://example.com/foo' }),
					text(', bar')
				]);
			});

			it('with brackets', () => {
				const tokens = analyze('https://example.com/foo(bar)');
				assert.deepStrictEqual(tokens, [
					leaf('url', { url: 'https://example.com/foo(bar)' })
				]);
			});

			it('ignore parent brackets', () => {
				const tokens = analyze('(https://example.com/foo)');
				assert.deepStrictEqual(tokens, [
					text('('),
					leaf('url', { url: 'https://example.com/foo' }),
					text(')')
				]);
			});

			it('ignore parent brackets 2', () => {
				const tokens = analyze('(foo https://example.com/foo)');
				assert.deepStrictEqual(tokens, [
					text('(foo '),
					leaf('url', { url: 'https://example.com/foo' }),
					text(')')
				]);
			});

			it('ignore parent brackets with internal brackets', () => {
				const tokens = analyze('(https://example.com/foo(bar))');
				assert.deepStrictEqual(tokens, [
					text('('),
					leaf('url', { url: 'https://example.com/foo(bar)' }),
					text(')')
				]);
			});
		});

		describe('link', () => {
			it('simple', () => {
				const tokens = analyze('[foo](https://example.com)');
				assert.deepStrictEqual(tokens, [
					tree('link', [
						text('foo')
					], { url: 'https://example.com', silent: false })
				]);
			});

			it('simple (with silent flag)', () => {
				const tokens = analyze('?[foo](https://example.com)');
				assert.deepStrictEqual(tokens, [
					tree('link', [
						text('foo')
					], { url: 'https://example.com', silent: true })
				]);
			});

			it('in text', () => {
				const tokens = analyze('before[foo](https://example.com)after');
				assert.deepStrictEqual(tokens, [
					text('before'),
					tree('link', [
						text('foo')
					], { url: 'https://example.com', silent: false }),
					text('after'),
				]);
			});

			it('with brackets', () => {
				const tokens = analyze('[foo](https://example.com/foo(bar))');
				assert.deepStrictEqual(tokens, [
					tree('link', [
						text('foo')
					], { url: 'https://example.com/foo(bar)', silent: false })
				]);
			});

			it('with parent brackets', () => {
				const tokens = analyze('([foo](https://example.com/foo(bar)))');
				assert.deepStrictEqual(tokens, [
					text('('),
					tree('link', [
						text('foo')
					], { url: 'https://example.com/foo(bar)', silent: false }),
					text(')')
				]);
			});
		});

		it('emoji', () => {
			const tokens1 = analyze(':cat:');
			assert.deepStrictEqual(tokens1, [
				leaf('emoji', { name: 'cat' })
			]);

			const tokens2 = analyze(':cat::cat::cat:');
			assert.deepStrictEqual(tokens2, [
				leaf('emoji', { name: 'cat' }),
				leaf('emoji', { name: 'cat' }),
				leaf('emoji', { name: 'cat' })
			]);

			const tokens3 = analyze('🍎');
			assert.deepStrictEqual(tokens3, [
				leaf('emoji', { emoji: '🍎' })
			]);
		});

		describe('block code', () => {
			it('simple', () => {
				const tokens = analyze('```\nvar x = "Strawberry Pasta";\n```');
				assert.deepStrictEqual(tokens, [
					leaf('blockCode', { code: 'var x = "Strawberry Pasta";', lang: null })
				]);
			});

			it('can specify language', () => {
				const tokens = analyze('``` json\n{ "x": 42 }\n```');
				assert.deepStrictEqual(tokens, [
					leaf('blockCode', { code: '{ "x": 42 }', lang: 'json' })
				]);
			});

			it('require line break before "```"', () => {
				const tokens = analyze('before```\nfoo\n```');
				assert.deepStrictEqual(tokens, [
					text('before'),
					leaf('inlineCode', { code: '`' }),
					text('\nfoo\n'),
					leaf('inlineCode', { code: '`' })
				]);
			});

			it('series', () => {
				const tokens = analyze('```\nfoo\n```\n```\nbar\n```\n```\nbaz\n```');
				assert.deepStrictEqual(tokens, [
					leaf('blockCode', { code: 'foo', lang: null }),
					leaf('blockCode', { code: 'bar', lang: null }),
					leaf('blockCode', { code: 'baz', lang: null }),
				]);
			});

			it('ignore internal marker', () => {
				const tokens = analyze('```\naaa```bbb\n```');
				assert.deepStrictEqual(tokens, [
					leaf('blockCode', { code: 'aaa```bbb', lang: null })
				]);
			});

			it('trim after line break', () => {
				const tokens = analyze('```\nfoo\n```\nbar');
				assert.deepStrictEqual(tokens, [
					leaf('blockCode', { code: 'foo', lang: null }),
					text('bar')
				]);
			});
		});

		describe('inline code', () => {
			it('simple', () => {
				const tokens = analyze('`var x = "Strawberry Pasta";`');
				assert.deepStrictEqual(tokens, [
					leaf('inlineCode', { code: 'var x = "Strawberry Pasta";' })
				]);
			});

			it('disallow line break', () => {
				const tokens = analyze('`foo\nbar`');
				assert.deepStrictEqual(tokens, [
					text('`foo\nbar`')
				]);
			});

			it('disallow ´', () => {
				const tokens = analyze('`foo´bar`');
				assert.deepStrictEqual(tokens, [
					text('`foo´bar`')
				]);
			});
		});

		it('mathInline', () => {
			const fomula = 'x = {-b \\pm \\sqrt{b^2-4ac} \\over 2a}';
			const content = `\\(${fomula}\\)`;
			const tokens = analyze(content);
			assert.deepStrictEqual(tokens, [
				leaf('mathInline', { formula: fomula })
			]);
		});

		describe('mathBlock', () => {
			it('simple', () => {
				const fomula = 'x = {-b \\pm \\sqrt{b^2-4ac} \\over 2a}';
				const content = `\\[\n${fomula}\n\\]`;
				const tokens = analyze(content);
				assert.deepStrictEqual(tokens, [
					leaf('mathBlock', { formula: fomula })
				]);
			});
		});

		it('search', () => {
			const tokens1 = analyze('a b c 検索');
			assert.deepStrictEqual(tokens1, [
				leaf('search', { content: 'a b c 検索', query: 'a b c' })
			]);

			const tokens2 = analyze('a b c Search');
			assert.deepStrictEqual(tokens2, [
				leaf('search', { content: 'a b c Search', query: 'a b c' })
			]);

			const tokens3 = analyze('a b c search');
			assert.deepStrictEqual(tokens3, [
				leaf('search', { content: 'a b c search', query: 'a b c' })
			]);

			const tokens4 = analyze('a b c SEARCH');
			assert.deepStrictEqual(tokens4, [
				leaf('search', { content: 'a b c SEARCH', query: 'a b c' })
			]);
		});

		describe('title', () => {
			it('simple', () => {
				const tokens = analyze('【foo】');
				assert.deepStrictEqual(tokens, [
					tree('title', [
						text('foo')
					], {})
				]);
			});

			it('require line break', () => {
				const tokens = analyze('a【foo】');
				assert.deepStrictEqual(tokens, [
					text('a【foo】')
				]);
			});

			it('with before and after texts', () => {
				const tokens = analyze('before\n【foo】\nafter');
				assert.deepStrictEqual(tokens, [
					text('before\n'),
					tree('title', [
						text('foo')
					], {}),
					text('after')
				]);
			});

			it('ignore multiple title blocks', () => {
				const tokens = analyze('【foo】bar【baz】');
				assert.deepStrictEqual(tokens, [
					text('【foo】bar【baz】')
				]);
			});

			it('disallow linebreak in title', () => {
				const tokens = analyze('【foo\nbar】');
				assert.deepStrictEqual(tokens, [
					text('【foo\nbar】')
				]);
			});
		});

		describe('center', () => {
			it('simple', () => {
				const tokens = analyze('<center>foo</center>');
				assert.deepStrictEqual(tokens, [
					tree('center', [
						text('foo')
					], {}),
				]);
			});
		});

		describe('strike', () => {
			it('simple', () => {
				const tokens = analyze('~~foo~~');
				assert.deepStrictEqual(tokens, [
					tree('strike', [
						text('foo')
					], {}),
				]);
			});
		});

		describe('italic', () => {
			it('<i>', () => {
				const tokens = analyze('<i>foo</i>');
				assert.deepStrictEqual(tokens, [
					tree('italic', [
						text('foo')
					], {}),
				]);
			});

			it('underscore', () => {
				const tokens = analyze('_foo_');
				assert.deepStrictEqual(tokens, [
					tree('italic', [
						text('foo')
					], {}),
				]);
			});

			it('simple with asterix', () => {
				const tokens = analyze('*foo*');
				assert.deepStrictEqual(tokens, [
					tree('italic', [
						text('foo')
					], {}),
				]);
			});

			it('exlude emotes', () => {
				const tokens = analyze('*.*');
				assert.deepStrictEqual(tokens, [
					text("*.*"),
				]);
			});

			it('mixed', () => {
				const tokens = analyze('_foo*');
				assert.deepStrictEqual(tokens, [
					text('_foo*'),
				]);
			});

			it('mixed', () => {
				const tokens = analyze('*foo_');
				assert.deepStrictEqual(tokens, [
					text('*foo_'),
				]);
			});

			it('ignore snake_case string', () => {
				const tokens = analyze('foo_bar_baz');
				assert.deepStrictEqual(tokens, [
					text('foo_bar_baz'),
				]);
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
		assert.deepStrictEqual(tokens, [
			tree('quote', [
				text('foo')
			], {}),
			leaf('blockCode', { code: 'bar', lang: null })
		]);
	});

	it('quote between two code blocks', () => {
		const tokens = analyze('```\nbefore\n```\n> foo\n```\nafter\n```');
		assert.deepStrictEqual(tokens, [
			leaf('blockCode', { code: 'before', lang: null }),
			tree('quote', [
				text('foo')
			], {}),
			leaf('blockCode', { code: 'after', lang: null })
		]);
	});
});
