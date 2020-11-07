/*
 * Tests of MFM
 *
 * How to run the tests:
 * > npx cross-env TS_NODE_FILES=true TS_NODE_TRANSPILE_ONLY=true npx mocha test/mfm.ts --require ts-node/register
 *
 * To specify test:
 * > npx cross-env TS_NODE_FILES=true TS_NODE_TRANSPILE_ONLY=true npx mocha test/mfm.ts --require ts-node/register -g 'test name'
 */

import * as assert from 'assert';

import { parse, parsePlain } from '../src/mfm/parse';
import { toHtml } from '../src/mfm/to-html';
import { fromHtml } from '../src/mfm/from-html';
import { toString } from '../src/mfm/to-string';
import { createTree as tree, createLeaf as leaf, MfmTree } from '../src/mfm/prelude';
import { removeOrphanedBrackets } from '../src/mfm/language';

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
		const tokens = parse('@himawari @hima_sub@namori.net お腹ペコい :cat: #yryr');
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
				const tokens = parse('**foo**');
				assert.deepStrictEqual(tokens, [
					tree('bold', [
						text('foo')
					], {}),
				]);
			});

			it('with other texts', () => {
				const tokens = parse('bar**foo**bar');
				assert.deepStrictEqual(tokens, [
					text('bar'),
					tree('bold', [
						text('foo')
					], {}),
					text('bar'),
				]);
			});

			it('with underscores', () => {
				const tokens = parse('__foo__');
				assert.deepStrictEqual(tokens, [
					tree('bold', [
						text('foo')
					], {}),
				]);
			});

			it('with underscores (ensure it allows alphabet only)', () => {
				const tokens = parse('(=^・__________・^=)');
				assert.deepStrictEqual(tokens, [
					text('(=^・__________・^=)')
				]);
			});

			it('mixed syntax', () => {
				const tokens = parse('**foo__');
				assert.deepStrictEqual(tokens, [
						text('**foo__'),
				]);
			});

			it('mixed syntax', () => {
				const tokens = parse('__foo**');
				assert.deepStrictEqual(tokens, [
						text('__foo**'),
				]);
			});
		});

		it('big', () => {
			const tokens = parse('***Strawberry*** Pasta');
			assert.deepStrictEqual(tokens, [
				tree('big', [
					text('Strawberry')
				], {}),
				text(' Pasta'),
			]);
		});

		it('small', () => {
			const tokens = parse('<small>smaller</small>');
			assert.deepStrictEqual(tokens, [
				tree('small', [
					text('smaller')
				], {}),
			]);
		});

		it('flip', () => {
			const tokens = parse('<flip>foo</flip>');
			assert.deepStrictEqual(tokens, [
				tree('flip', [
					text('foo')
				], {}),
			]);
		});

		describe('spin', () => {
			it('text', () => {
				const tokens = parse('<spin>foo</spin>');
				assert.deepStrictEqual(tokens, [
					tree('spin', [
						text('foo')
					], {
						attr: null
					}),
				]);
			});

			it('emoji', () => {
				const tokens = parse('<spin>:foo:</spin>');
				assert.deepStrictEqual(tokens, [
					tree('spin', [
						leaf('emoji', { name: 'foo' })
					], {
						attr: null
					}),
				]);
			});

			it('with attr', () => {
				const tokens = parse('<spin left>:foo:</spin>');
				assert.deepStrictEqual(tokens, [
					tree('spin', [
						leaf('emoji', { name: 'foo' })
					], {
						attr: 'left'
					}),
				]);
			});
/*
			it('multi', () => {
				const tokens = parse('<spin>:foo:</spin><spin>:foo:</spin>');
				assert.deepStrictEqual(tokens, [
					tree('spin', [
						leaf('emoji', { name: 'foo' })
					], {
						attr: null
					}),
					tree('spin', [
						leaf('emoji', { name: 'foo' })
					], {
						attr: null
					}),
				]);
			});

			it('nested', () => {
				const tokens = parse('<spin><spin>:foo:</spin></spin>');
				assert.deepStrictEqual(tokens, [
					tree('spin', [
						tree('spin', [
							leaf('emoji', { name: 'foo' })
						], {
							attr: null
						}),
					], {
						attr: null
					}),
				]);
			});
*/
		});

		it('jump', () => {
			const tokens = parse('<jump>:foo:</jump>');
			assert.deepStrictEqual(tokens, [
				tree('jump', [
					leaf('emoji', { name: 'foo' })
				], {}),
			]);
		});

		describe('motion', () => {
			it('by triple brackets', () => {
				const tokens = parse('(((foo)))');
				assert.deepStrictEqual(tokens, [
					tree('motion', [
						text('foo')
					], {}),
				]);
			});

			it('by triple brackets (with other texts)', () => {
				const tokens = parse('bar(((foo)))bar');
				assert.deepStrictEqual(tokens, [
					text('bar'),
					tree('motion', [
						text('foo')
					], {}),
					text('bar'),
				]);
			});

			it('by <motion> tag', () => {
				const tokens = parse('<motion>foo</motion>');
				assert.deepStrictEqual(tokens, [
					tree('motion', [
						text('foo')
					], {}),
				]);
			});

			it('by <motion> tag (with other texts)', () => {
				const tokens = parse('bar<motion>foo</motion>bar');
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
				const tokens = parse('@himawari foo');
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
				const tokens = parse('@hima_sub@namori.net foo');
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
				const tokens = parse('@hima_sub@xn--q9j5bya.xn--zckzah foo');
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
				const tokens = parse('idolm@ster');
				assert.deepStrictEqual(tokens, [
					text('idolm@ster')
				]);

				const tokens2 = parse('@a\n@b\n@c');
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

				const tokens3 = parse('**x**@a');
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

				const tokens4 = parse('@\n@v\n@veryverylongusername');
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
				const tokens = parse('#alice');
				assert.deepStrictEqual(tokens, [
					leaf('hashtag', { hashtag: 'alice' })
				]);
			});

			it('after line break', () => {
				const tokens = parse('foo\n#alice');
				assert.deepStrictEqual(tokens, [
					text('foo\n'),
					leaf('hashtag', { hashtag: 'alice' })
				]);
			});

			it('with text', () => {
				const tokens = parse('Strawberry Pasta #alice');
				assert.deepStrictEqual(tokens, [
					text('Strawberry Pasta '),
					leaf('hashtag', { hashtag: 'alice' })
				]);
			});

			it('with text (zenkaku)', () => {
				const tokens = parse('こんにちは#世界');
				assert.deepStrictEqual(tokens, [
					text('こんにちは'),
					leaf('hashtag', { hashtag: '世界' })
				]);
			});

			it('ignore comma and period', () => {
				const tokens = parse('Foo #bar, baz #piyo.');
				assert.deepStrictEqual(tokens, [
					text('Foo '),
					leaf('hashtag', { hashtag: 'bar' }),
					text(', baz '),
					leaf('hashtag', { hashtag: 'piyo' }),
					text('.'),
				]);
			});

			it('ignore exclamation mark', () => {
				const tokens = parse('#Foo!');
				assert.deepStrictEqual(tokens, [
					leaf('hashtag', { hashtag: 'Foo' }),
					text('!'),
				]);
			});

			it('ignore colon', () => {
				const tokens = parse('#Foo:');
				assert.deepStrictEqual(tokens, [
					leaf('hashtag', { hashtag: 'Foo' }),
					text(':'),
				]);
			});

			it('ignore single quote', () => {
				const tokens = parse('#foo\'');
				assert.deepStrictEqual(tokens, [
					leaf('hashtag', { hashtag: 'foo' }),
					text('\''),
				]);
			});

			it('ignore double quote', () => {
				const tokens = parse('#foo"');
				assert.deepStrictEqual(tokens, [
					leaf('hashtag', { hashtag: 'foo' }),
					text('"'),
				]);
			});

			it('ignore square brackets', () => {
				const tokens = parse('#foo]');
				assert.deepStrictEqual(tokens, [
					leaf('hashtag', { hashtag: 'foo' }),
					text(']'),
				]);
			});

			it('ignore 】', () => {
				const tokens = parse('#foo】');
				assert.deepStrictEqual(tokens, [
					leaf('hashtag', { hashtag: 'foo' }),
					text('】'),
				]);
			});

			it('allow including number', () => {
				const tokens = parse('#foo123');
				assert.deepStrictEqual(tokens, [
					leaf('hashtag', { hashtag: 'foo123' }),
				]);
			});

			it('with brackets', () => {
				const tokens1 = parse('(#foo)');
				assert.deepStrictEqual(tokens1, [
					text('('),
					leaf('hashtag', { hashtag: 'foo' }),
					text(')'),
				]);

				const tokens2 = parse('「#foo」');
				assert.deepStrictEqual(tokens2, [
					text('「'),
					leaf('hashtag', { hashtag: 'foo' }),
					text('」'),
				]);
			});

			it('with mixed brackets', () => {
				const tokens = parse('「#foo(bar)」');
				assert.deepStrictEqual(tokens, [
					text('「'),
					leaf('hashtag', { hashtag: 'foo(bar)' }),
					text('」'),
				]);
			});

			it('with brackets (space before)', () => {
				const tokens1 = parse('(bar #foo)');
				assert.deepStrictEqual(tokens1, [
					text('(bar '),
					leaf('hashtag', { hashtag: 'foo' }),
					text(')'),
				]);

				const tokens2 = parse('「bar #foo」');
				assert.deepStrictEqual(tokens2, [
					text('「bar '),
					leaf('hashtag', { hashtag: 'foo' }),
					text('」'),
				]);
			});

			it('disallow number only', () => {
				const tokens = parse('#123');
				assert.deepStrictEqual(tokens, [
					text('#123'),
				]);
			});

			it('disallow number only (with brackets)', () => {
				const tokens = parse('(#123)');
				assert.deepStrictEqual(tokens, [
					text('(#123)'),
				]);
			});

			it('ignore slash', () => {
				const tokens = parse('#foo/bar');
				assert.deepStrictEqual(tokens, [
					leaf('hashtag', { hashtag: 'foo' }),
					text('/bar'),
				]);
			});

			it('ignore Keycap Number Sign (U+0023 + U+20E3)', () => {
				const tokens = parse('#⃣');
				assert.deepStrictEqual(tokens, [
					leaf('emoji', { emoji: '#⃣' })
				]);
			});

			it('ignore Keycap Number Sign (U+0023 + U+FE0F + U+20E3)', () => {
				const tokens = parse('#️⃣');
				assert.deepStrictEqual(tokens, [
					leaf('emoji', { emoji: '#️⃣' })
				]);
			});
		});

		describe('quote', () => {
			it('basic', () => {
				const tokens1 = parse('> foo');
				assert.deepStrictEqual(tokens1, [
					tree('quote', [
						text('foo')
					], {})
				]);

				const tokens2 = parse('>foo');
				assert.deepStrictEqual(tokens2, [
					tree('quote', [
						text('foo')
					], {})
				]);
			});

			it('series', () => {
				const tokens = parse('> foo\n\n> bar');
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
				const tokens1 = parse('> foo\n');
				assert.deepStrictEqual(tokens1, [
					tree('quote', [
						text('foo')
					], {}),
				]);

				const tokens2 = parse('> foo\n\n');
				assert.deepStrictEqual(tokens2, [
					tree('quote', [
						text('foo')
					], {}),
					text('\n')
				]);
			});

			it('multiline', () => {
				const tokens1 = parse('>foo\n>bar');
				assert.deepStrictEqual(tokens1, [
					tree('quote', [
						text('foo\nbar')
					], {})
				]);

				const tokens2 = parse('> foo\n> bar');
				assert.deepStrictEqual(tokens2, [
					tree('quote', [
						text('foo\nbar')
					], {})
				]);
			});

			it('multiline with trailing line break', () => {
				const tokens1 = parse('> foo\n> bar\n');
				assert.deepStrictEqual(tokens1, [
					tree('quote', [
						text('foo\nbar')
					], {}),
				]);

				const tokens2 = parse('> foo\n> bar\n\n');
				assert.deepStrictEqual(tokens2, [
					tree('quote', [
						text('foo\nbar')
					], {}),
					text('\n')
				]);
			});

			it('with before and after texts', () => {
				const tokens = parse('before\n> foo\nafter');
				assert.deepStrictEqual(tokens, [
					text('before\n'),
					tree('quote', [
						text('foo')
					], {}),
					text('after'),
				]);
			});

			it('multiple quotes', () => {
				const tokens = parse('> foo\nbar\n\n> foo\nbar\n\n> foo\nbar');
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
				const tokens = parse('foo>bar');
				assert.deepStrictEqual(tokens, [
					text('foo>bar'),
				]);
			});

			it('nested', () => {
				const tokens = parse('>> foo\n> bar');
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
				const tokens = parse('foo\n\n>a\n>>b\n>>\n>>>\n>>>c\n>>>\n>d\n\n');
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
				const tokens = parse('https://example.com');
				assert.deepStrictEqual(tokens, [
					leaf('url', { url: 'https://example.com' })
				]);
			});

			it('ignore trailing period', () => {
				const tokens = parse('https://example.com.');
				assert.deepStrictEqual(tokens, [
					leaf('url', { url: 'https://example.com' }),
					text('.')
				]);
			});

			it('ignore trailing periods', () => {
				const tokens = parse('https://example.com...');
				assert.deepStrictEqual(tokens, [
					leaf('url', { url: 'https://example.com' }),
					text('...')
				]);
			});

			it('with comma', () => {
				const tokens = parse('https://example.com/foo?bar=a,b');
				assert.deepStrictEqual(tokens, [
					leaf('url', { url: 'https://example.com/foo?bar=a,b' })
				]);
			});

			it('ignore trailing comma', () => {
				const tokens = parse('https://example.com/foo, bar');
				assert.deepStrictEqual(tokens, [
					leaf('url', { url: 'https://example.com/foo' }),
					text(', bar')
				]);
			});

			it('with brackets', () => {
				const tokens = parse('https://example.com/foo(bar)');
				assert.deepStrictEqual(tokens, [
					leaf('url', { url: 'https://example.com/foo(bar)' })
				]);
			});

			it('ignore parent brackets', () => {
				const tokens = parse('(https://example.com/foo)');
				assert.deepStrictEqual(tokens, [
					text('('),
					leaf('url', { url: 'https://example.com/foo' }),
					text(')')
				]);
			});

			it('ignore parent []', () => {
				const tokens = parse('foo [https://example.com/foo] bar');
				assert.deepStrictEqual(tokens, [
					text('foo ['),
					leaf('url', { url: 'https://example.com/foo' }),
					text('] bar')
				]);
			});

			it('ignore parent brackets 2', () => {
				const tokens = parse('(foo https://example.com/foo)');
				assert.deepStrictEqual(tokens, [
					text('(foo '),
					leaf('url', { url: 'https://example.com/foo' }),
					text(')')
				]);
			});

			it('ignore parent brackets with internal brackets', () => {
				const tokens = parse('(https://example.com/foo(bar))');
				assert.deepStrictEqual(tokens, [
					text('('),
					leaf('url', { url: 'https://example.com/foo(bar)' }),
					text(')')
				]);
			});

			it('ignore non-ascii characters contained url without angle brackets', () => {
				const tokens = parse('https://大石泉すき.example.com');
				assert.deepStrictEqual(tokens, [
					text('https://大石泉すき.example.com')
				]);
			});

			it('match non-ascii characters contained url with angle brackets', () => {
				const tokens = parse('<https://大石泉すき.example.com>');
				assert.deepStrictEqual(tokens, [
					leaf('url', { url: 'https://大石泉すき.example.com' })
				]);
			});
		});

		describe('link', () => {
			it('simple', () => {
				const tokens = parse('[foo](https://example.com)');
				assert.deepStrictEqual(tokens, [
					tree('link', [
						text('foo')
					], { url: 'https://example.com', silent: false })
				]);
			});

			it('simple (with silent flag)', () => {
				const tokens = parse('?[foo](https://example.com)');
				assert.deepStrictEqual(tokens, [
					tree('link', [
						text('foo')
					], { url: 'https://example.com', silent: true })
				]);
			});

			it('in text', () => {
				const tokens = parse('before[foo](https://example.com)after');
				assert.deepStrictEqual(tokens, [
					text('before'),
					tree('link', [
						text('foo')
					], { url: 'https://example.com', silent: false }),
					text('after'),
				]);
			});

			it('with brackets', () => {
				const tokens = parse('[foo](https://example.com/foo(bar))');
				assert.deepStrictEqual(tokens, [
					tree('link', [
						text('foo')
					], { url: 'https://example.com/foo(bar)', silent: false })
				]);
			});

			it('with parent brackets', () => {
				const tokens = parse('([foo](https://example.com/foo(bar)))');
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
			const tokens1 = parse(':cat:');
			assert.deepStrictEqual(tokens1, [
				leaf('emoji', { name: 'cat' })
			]);

			const tokens2 = parse(':cat::cat::cat:');
			assert.deepStrictEqual(tokens2, [
				leaf('emoji', { name: 'cat' }),
				leaf('emoji', { name: 'cat' }),
				leaf('emoji', { name: 'cat' })
			]);

			const tokens3 = parse('🍎');
			assert.deepStrictEqual(tokens3, [
				leaf('emoji', { emoji: '🍎' })
			]);
		});

		describe('block code', () => {
			it('simple', () => {
				const tokens = parse('```\nvar x = "Strawberry Pasta";\n```');
				assert.deepStrictEqual(tokens, [
					leaf('blockCode', { code: 'var x = "Strawberry Pasta";', lang: null })
				]);
			});

			it('can specify language', () => {
				const tokens = parse('``` json\n{ "x": 42 }\n```');
				assert.deepStrictEqual(tokens, [
					leaf('blockCode', { code: '{ "x": 42 }', lang: 'json' })
				]);
			});

			it('require line break before "```"', () => {
				const tokens = parse('before```\nfoo\n```');
				assert.deepStrictEqual(tokens, [
					text('before'),
					leaf('inlineCode', { code: '`' }),
					text('\nfoo\n'),
					leaf('inlineCode', { code: '`' })
				]);
			});

			it('series', () => {
				const tokens = parse('```\nfoo\n```\n```\nbar\n```\n```\nbaz\n```');
				assert.deepStrictEqual(tokens, [
					leaf('blockCode', { code: 'foo', lang: null }),
					leaf('blockCode', { code: 'bar', lang: null }),
					leaf('blockCode', { code: 'baz', lang: null }),
				]);
			});

			it('ignore internal marker', () => {
				const tokens = parse('```\naaa```bbb\n```');
				assert.deepStrictEqual(tokens, [
					leaf('blockCode', { code: 'aaa```bbb', lang: null })
				]);
			});

			it('trim after line break', () => {
				const tokens = parse('```\nfoo\n```\nbar');
				assert.deepStrictEqual(tokens, [
					leaf('blockCode', { code: 'foo', lang: null }),
					text('bar')
				]);
			});
		});

		describe('inline code', () => {
			it('simple', () => {
				const tokens = parse('`var x = "Strawberry Pasta";`');
				assert.deepStrictEqual(tokens, [
					leaf('inlineCode', { code: 'var x = "Strawberry Pasta";' })
				]);
			});

			it('disallow line break', () => {
				const tokens = parse('`foo\nbar`');
				assert.deepStrictEqual(tokens, [
					text('`foo\nbar`')
				]);
			});

			it('disallow ´', () => {
				const tokens = parse('`foo´bar`');
				assert.deepStrictEqual(tokens, [
					text('`foo´bar`')
				]);
			});
		});

		it('mathInline', () => {
			const fomula = 'x = {-b \\pm \\sqrt{b^2-4ac} \\over 2a}';
			const content = `\\(${fomula}\\)`;
			const tokens = parse(content);
			assert.deepStrictEqual(tokens, [
				leaf('mathInline', { formula: fomula })
			]);
		});

		describe('mathBlock', () => {
			it('simple', () => {
				const fomula = 'x = {-b \\pm \\sqrt{b^2-4ac} \\over 2a}';
				const content = `\\[\n${fomula}\n\\]`;
				const tokens = parse(content);
				assert.deepStrictEqual(tokens, [
					leaf('mathBlock', { formula: fomula })
				]);
			});
		});

		it('search', () => {
			const tokens1 = parse('a b c 検索');
			assert.deepStrictEqual(tokens1, [
				leaf('search', { content: 'a b c 検索', query: 'a b c' })
			]);

			const tokens2 = parse('a b c Search');
			assert.deepStrictEqual(tokens2, [
				leaf('search', { content: 'a b c Search', query: 'a b c' })
			]);

			const tokens3 = parse('a b c search');
			assert.deepStrictEqual(tokens3, [
				leaf('search', { content: 'a b c search', query: 'a b c' })
			]);

			const tokens4 = parse('a b c SEARCH');
			assert.deepStrictEqual(tokens4, [
				leaf('search', { content: 'a b c SEARCH', query: 'a b c' })
			]);
		});

		describe('title', () => {
			it('simple', () => {
				const tokens = parse('【foo】');
				assert.deepStrictEqual(tokens, [
					tree('title', [
						text('foo')
					], {})
				]);
			});

			it('require line break', () => {
				const tokens = parse('a【foo】');
				assert.deepStrictEqual(tokens, [
					text('a【foo】')
				]);
			});

			it('with before and after texts', () => {
				const tokens = parse('before\n【foo】\nafter');
				assert.deepStrictEqual(tokens, [
					text('before\n'),
					tree('title', [
						text('foo')
					], {}),
					text('after')
				]);
			});

			it('ignore multiple title blocks', () => {
				const tokens = parse('【foo】bar【baz】');
				assert.deepStrictEqual(tokens, [
					text('【foo】bar【baz】')
				]);
			});

			it('disallow linebreak in title', () => {
				const tokens = parse('【foo\nbar】');
				assert.deepStrictEqual(tokens, [
					text('【foo\nbar】')
				]);
			});
		});

		describe('center', () => {
			it('simple', () => {
				const tokens = parse('<center>foo</center>');
				assert.deepStrictEqual(tokens, [
					tree('center', [
						text('foo')
					], {}),
				]);
			});
		});

		describe('strike', () => {
			it('simple', () => {
				const tokens = parse('~~foo~~');
				assert.deepStrictEqual(tokens, [
					tree('strike', [
						text('foo')
					], {}),
				]);
			});

			// https://misskey.io/notes/7u1kv5dmia
			it('ignore internal tilde', () => {
				const tokens = parse('~~~~~');
				assert.deepStrictEqual(tokens, [
					text('~~~~~')
				]);
			});
		});

		describe('italic', () => {
			it('<i>', () => {
				const tokens = parse('<i>foo</i>');
				assert.deepStrictEqual(tokens, [
					tree('italic', [
						text('foo')
					], {}),
				]);
			});

			it('underscore', () => {
				const tokens = parse('_foo_');
				assert.deepStrictEqual(tokens, [
					tree('italic', [
						text('foo')
					], {}),
				]);
			});

			it('simple with asterix', () => {
				const tokens = parse('*foo*');
				assert.deepStrictEqual(tokens, [
					tree('italic', [
						text('foo')
					], {}),
				]);
			});

			it('exlude emotes', () => {
				const tokens = parse('*.*');
				assert.deepStrictEqual(tokens, [
					text('*.*'),
				]);
			});

			it('mixed', () => {
				const tokens = parse('_foo*');
				assert.deepStrictEqual(tokens, [
					text('_foo*'),
				]);
			});

			it('mixed', () => {
				const tokens = parse('*foo_');
				assert.deepStrictEqual(tokens, [
					text('*foo_'),
				]);
			});

			it('ignore snake_case string', () => {
				const tokens = parse('foo_bar_baz');
				assert.deepStrictEqual(tokens, [
					text('foo_bar_baz'),
				]);
			});

			it('require spaces', () => {
				const tokens = parse('４日目_L38b a_b');
				assert.deepStrictEqual(tokens, [
					text('４日目_L38b a_b'),
				]);
			});

			it('newline sandwich', () => {
				const tokens = parse('foo\n_bar_\nbaz');
				assert.deepStrictEqual(tokens, [
					text('foo\n'),
					tree('italic', [
						text('bar')
					], {}),
					text('\nbaz'),
				]);
			});
		});
	});

	describe('plainText', () => {
		it('text', () => {
			const tokens = parsePlain('foo');
			assert.deepStrictEqual(tokens, [
				text('foo'),
			]);
		});

		it('emoji', () => {
			const tokens = parsePlain(':foo:');
			assert.deepStrictEqual(tokens, [
				leaf('emoji', { name: 'foo' })
			]);
		});

		it('emoji in text', () => {
			const tokens = parsePlain('foo:bar:baz');
			assert.deepStrictEqual(tokens, [
				text('foo'),
				leaf('emoji', { name: 'bar' }),
				text('baz'),
			]);
		});

		it('disallow other syntax', () => {
			const tokens = parsePlain('foo **bar** baz');
			assert.deepStrictEqual(tokens, [
				text('foo **bar** baz'),
			]);
		});
	});

	describe('toHtml', () => {
		it('br', () => {
			const input = 'foo\nbar\nbaz';
			const output = '<p><span>foo<br>bar<br>baz</span></p>';
			assert.equal(toHtml(parse(input)), output);
		});

		it('br alt', () => {
			const input = 'foo\r\nbar\rbaz';
			const output = '<p><span>foo<br>bar<br>baz</span></p>';
			assert.equal(toHtml(parse(input)), output);
		});
	});

	it('code block with quote', () => {
		const tokens = parse('> foo\n```\nbar\n```');
		assert.deepStrictEqual(tokens, [
			tree('quote', [
				text('foo')
			], {}),
			leaf('blockCode', { code: 'bar', lang: null })
		]);
	});

	it('quote between two code blocks', () => {
		const tokens = parse('```\nbefore\n```\n> foo\n```\nafter\n```');
		assert.deepStrictEqual(tokens, [
			leaf('blockCode', { code: 'before', lang: null }),
			tree('quote', [
				text('foo')
			], {}),
			leaf('blockCode', { code: 'after', lang: null })
		]);
	});

	describe('toString', () => {
		it('太字', () => {
			assert.deepStrictEqual(toString(parse('**太字**')), '**太字**');
		});
		it('中央揃え', () => {
			assert.deepStrictEqual(toString(parse('<center>中央揃え</center>')), '<center>中央揃え</center>');
		});
		it('打ち消し線', () => {
			assert.deepStrictEqual(toString(parse('~~打ち消し線~~')), '~~打ち消し線~~');
		});
		it('小さい字', () => {
			assert.deepStrictEqual(toString(parse('<small>小さい字</small>')), '<small>小さい字</small>');
		});
		it('モーション', () => {
			assert.deepStrictEqual(toString(parse('<motion>モーション</motion>')), '<motion>モーション</motion>');
		});
		it('モーション2', () => {
			assert.deepStrictEqual(toString(parse('(((モーション)))')), '<motion>モーション</motion>');
		});
		it('ビッグ＋', () => {
			assert.deepStrictEqual(toString(parse('*** ビッグ＋ ***')), '*** ビッグ＋ ***');
		});
		it('回転', () => {
			assert.deepStrictEqual(toString(parse('<spin>回転</spin>')), '<spin>回転</spin>');
		});
		it('右回転', () => {
			assert.deepStrictEqual(toString(parse('<spin right>右回転</spin>')), '<spin right>右回転</spin>');
		});
		it('左回転', () => {
			assert.deepStrictEqual(toString(parse('<spin left>左回転</spin>')), '<spin left>左回転</spin>');
		});
		it('往復回転', () => {
			assert.deepStrictEqual(toString(parse('<spin alternate>往復回転</spin>')), '<spin alternate>往復回転</spin>');
		});
		it('ジャンプ', () => {
			assert.deepStrictEqual(toString(parse('<jump>ジャンプ</jump>')), '<jump>ジャンプ</jump>');
		});
		it('コードブロック', () => {
			assert.deepStrictEqual(toString(parse('```\nコードブロック\n```')), '```\nコードブロック\n```');
		});
		it('インラインコード', () => {
			assert.deepStrictEqual(toString(parse('`インラインコード`')), '`インラインコード`');
		});
		it('引用行', () => {
			assert.deepStrictEqual(toString(parse('>引用行')), '>引用行');
		});
		it('検索', () => {
			assert.deepStrictEqual(toString(parse('検索 [search]')), '検索 [search]');
		});
		it('リンク', () => {
			assert.deepStrictEqual(toString(parse('[リンク](http://example.com)')), '[リンク](http://example.com)');
		});
		it('詳細なしリンク', () => {
			assert.deepStrictEqual(toString(parse('?[詳細なしリンク](http://example.com)')), '?[詳細なしリンク](http://example.com)');
		});
		it('【タイトル】', () => {
			assert.deepStrictEqual(toString(parse('【タイトル】')), '[タイトル]');
		});
		it('[タイトル]', () => {
			assert.deepStrictEqual(toString(parse('[タイトル]')), '[タイトル]');
		});
		it('インライン数式', () => {
			assert.deepStrictEqual(toString(parse('\\(インライン数式\\)')), '\\(インライン数式\\)');
		});
		it('ブロック数式', () => {
			assert.deepStrictEqual(toString(parse('\\\[\nブロック数式\n\]\\')), '\\\[\nブロック数式\n\]\\');
		});
	});
});

describe('fromHtml', () => {
	it('br', () => {
		assert.deepStrictEqual(fromHtml('<p>abc<br><br/>d</p>'), 'abc\n\nd');
	});

	it('link with different text', () => {
		assert.deepStrictEqual(fromHtml('<p>a <a href="https://example.com/b">c</a> d</p>'), 'a [c](https://example.com/b) d');
	});

	it('link with same text', () => {
		assert.deepStrictEqual(fromHtml('<p>a <a href="https://example.com/b">https://example.com/b</a> d</p>'), 'a https://example.com/b d');
	});

	it('link with same text, but not encoded', () => {
		assert.deepStrictEqual(fromHtml('<p>a <a href="https://example.com/ä">https://example.com/ä</a> d</p>'), 'a <https://example.com/ä> d');
	});

	it('link with no url', () => {
		assert.deepStrictEqual(fromHtml('<p>a <a href="b">c</a> d</p>'), 'a [c](b) d');
	});

	it('link without href', () => {
		assert.deepStrictEqual(fromHtml('<p>a <a>c</a> d</p>'), 'a c d');
	});

	it('mention', () => {
		assert.deepStrictEqual(fromHtml('<p>a <a href="https://example.com/@user" class="u-url mention">@user</a> d</p>'), 'a @user@example.com d');
	});

	it('hashtag', () => {
		assert.deepStrictEqual(fromHtml('<p>a <a href="https://example.com/tags/a">#a</a> d</p>', ['#a']), 'a #a d');
	});
});
