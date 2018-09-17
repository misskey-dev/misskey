import * as assert from 'assert';

import analyze from '../src/mfm/parse';
import toHtml from '../src/mfm/html';
import syntaxhighlighter from '../src/mfm/parse/core/syntax-highlighter';

describe('Text', () => {
	it('can be analyzed', () => {
		const tokens = analyze('@himawari @hima_sub@namori.net お腹ペコい :cat: #yryr');
		assert.deepEqual([
			{ type: 'mention', content: '@himawari', username: 'himawari', host: null },
			{ type: 'text', content: ' '},
			{ type: 'mention', content: '@hima_sub@namori.net', username: 'hima_sub', host: 'namori.net' },
			{ type: 'text', content: ' お腹ペコい ' },
			{ type: 'emoji', content: ':cat:', emoji: 'cat'},
			{ type: 'text', content: ' '},
			{ type: 'hashtag', content: '#yryr', hashtag: 'yryr' }
		], tokens);
	});

	it('can be inverted', () => {
		const text = '@himawari @hima_sub@namori.net お腹ペコい :cat: #yryr';
		assert.equal(analyze(text).map(x => x.content).join(''), text);
	});

	describe('elements', () => {
		it('bold', () => {
			const tokens = analyze('**Strawberry** Pasta');
			assert.deepEqual([
				{ type: 'bold', content: '**Strawberry**', bold: 'Strawberry' },
				{ type: 'text', content: ' Pasta' }
			], tokens);
		});

		it('big', () => {
			const tokens = analyze('***Strawberry*** Pasta');
			assert.deepEqual([
				{ type: 'big', content: '***Strawberry***', big: 'Strawberry' },
				{ type: 'text', content: ' Pasta' }
			], tokens);
		});

		it('motion', () => {
			const tokens1 = analyze('(((Strawberry))) Pasta');
			assert.deepEqual([
				{ type: 'motion', content: '(((Strawberry)))', motion: 'Strawberry' },
				{ type: 'text', content: ' Pasta' }
			], tokens1);

			const tokens2 = analyze('<motion>Strawberry</motion> Pasta');
			assert.deepEqual([
				{ type: 'motion', content: '<motion>Strawberry</motion>', motion: 'Strawberry' },
				{ type: 'text', content: ' Pasta' }
			], tokens2);
		});

		it('mention', () => {
			const tokens = analyze('@himawari お腹ペコい');
			assert.deepEqual([
				{ type: 'mention', content: '@himawari', username: 'himawari', host: null },
				{ type: 'text', content: ' お腹ペコい' }
			], tokens);
		});

		it('remote mention', () => {
			const tokens = analyze('@hima_sub@namori.net お腹ペコい');
			assert.deepEqual([
				{ type: 'mention', content: '@hima_sub@namori.net', username: 'hima_sub', host: 'namori.net' },
				{ type: 'text', content: ' お腹ペコい' }
			], tokens);
		});

		it('hashtag', () => {
			const tokens1 = analyze('Strawberry Pasta #alice');
			assert.deepEqual([
				{ type: 'text', content: 'Strawberry Pasta ' },
				{ type: 'hashtag', content: '#alice', hashtag: 'alice' }
			], tokens1);

			const tokens2 = analyze('Foo #bar, baz #piyo.');
			assert.deepEqual([
				{ type: 'text', content: 'Foo ' },
				{ type: 'hashtag', content: '#bar', hashtag: 'bar' },
				{ type: 'text', content: ', baz ' },
				{ type: 'hashtag', content: '#piyo', hashtag: 'piyo' },
				{ type: 'text', content: '.' }
			], tokens2);
		});

		it('url', () => {
			const tokens = analyze('https://himasaku.net');
			assert.deepEqual([{
				type: 'url',
				content: 'https://himasaku.net',
				url: 'https://himasaku.net'
			}], tokens);
		});

		it('link', () => {
			const tokens = analyze('[ひまさく](https://himasaku.net)');
			assert.deepEqual([{
				type: 'link',
				content: '[ひまさく](https://himasaku.net)',
				title: 'ひまさく',
				url: 'https://himasaku.net',
				silent: false
			}], tokens);
		});

		it('emoji', () => {
			const tokens = analyze(':cat:');
			assert.deepEqual([
				{ type: 'emoji', content: ':cat:', emoji: 'cat'}
			], tokens);
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

		it('search', () => {
			const tokens1 = analyze('a b c 検索');
			assert.deepEqual([
				{ type: 'search', content: 'a b c 検索', query: 'a b c'}
			], tokens1);

			const tokens2 = analyze('a b c Search');
			assert.deepEqual([
				{ type: 'search', content: 'a b c Search', query: 'a b c'}
			], tokens2);

			const tokens3 = analyze('a b c search');
			assert.deepEqual([
				{ type: 'search', content: 'a b c search', query: 'a b c'}
			], tokens3);

			const tokens4 = analyze('a b c SEARCH');
			assert.deepEqual([
				{ type: 'search', content: 'a b c SEARCH', query: 'a b c'}
			], tokens4);
		});

		it('title', () => {
			const tokens1 = analyze('【yee】\nhaw');
			assert.deepEqual(
				{ type: 'title', content: '【yee】\n', title: 'yee'}
			, tokens1[0]);

			const tokens2 = analyze('[yee]\nhaw');
			assert.deepEqual(
				{ type: 'title', content: '[yee]\n', title: 'yee'}
			, tokens2[0]);
		});
	});

	describe('syntax highlighting', () => {
		it('comment', () => {
			const html1 = syntaxhighlighter('// Strawberry pasta');
			assert.equal(html1, '<span class="comment">// Strawberry pasta</span>');

			const html2 = syntaxhighlighter('x // x\ny // y');
			assert.equal(html2, 'x <span class="comment">// x\n</span>y <span class="comment">// y</span>');
		});

		it('regexp', () => {
			const html = syntaxhighlighter('/.*/');
			assert.equal(html, '<span class="regexp">/.*/</span>');
		});

		it('slash', () => {
			const html = syntaxhighlighter('/');
			assert.equal(html, '<span class="symbol">/</span>');
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
