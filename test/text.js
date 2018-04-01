/**
 * Text Tests!
 */

const assert = require('assert');

const analyze = require('../built/common/text').default;
const syntaxhighlighter = require('../built/common/text/core/syntax-highlighter').default;

describe('Text', () => {
	it('can be analyzed', () => {
		const tokens = analyze('@himawari お腹ペコい :cat: #yryr');
		assert.deepEqual([
			{ type: 'mention', content: '@himawari', username: 'himawari', host: null },
			{ type: 'text', content: ' お腹ペコい ' },
			{ type: 'emoji', content: ':cat:', emoji: 'cat'},
			{ type: 'text', content: ' '},
			{ type: 'hashtag', content: '#yryr', hashtag: 'yryr' }
		], tokens);
	});

	it('can be inverted', () => {
		const text = '@himawari お腹ペコい :cat: #yryr';
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

		it('mention', () => {
			const tokens = analyze('@himawari お腹ペコい');
			assert.deepEqual([
				{ type: 'mention', content: '@himawari', username: 'himawari', host: null },
				{ type: 'text', content: ' お腹ペコい' }
			], tokens);
		});

		it('hashtag', () => {
			const tokens = analyze('Strawberry Pasta #alice');
			assert.deepEqual([
				{ type: 'text', content: 'Strawberry Pasta ' },
				{ type: 'hashtag', content: '#alice', hashtag: 'alice' }
			], tokens);
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
});
