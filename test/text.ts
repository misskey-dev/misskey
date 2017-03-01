/**
 * Text Tests!
 */

const assert = require('assert');

const analyze = require('../src/common/text');
const syntaxhighlighter = require('../src/common/text/core/syntax-highlighter');

describe('Text', () => {
	it('is correctly analyzed', () => {
		const tokens = analyze('@himawari お腹ペコい :cat: #yryr');
		assert.deepEqual([
			{ type: 'mention', content: '@himawari', username: 'himawari' },
			{ type: 'text', content: ' お腹ペコい ' },
			{ type: 'emoji', content: ':cat:', emoji: 'cat'},
			{ type: 'text', content: ' '},
			{ type: 'hashtag', content: '#yryr', hashtag: 'yryr' }
		], tokens);
	});

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
			{ type: 'mention', content: '@himawari', username: 'himawari' },
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

	it('link', () => {
		const tokens = analyze('https://himasaku.net');
		assert.deepEqual([
			{ type: 'link', content: 'https://himasaku.net' }
		], tokens);
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

	describe('syntax highlighting', () => {
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
