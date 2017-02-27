/**
 * Text Tests!
 */

const assert = require('assert');

const analyze = require('../src/common/text');
//const complie = require('../src/web/app/common/scripts/text-compiler');

describe('Text', () => {
	it('is correctly analyzed', () => {
		const tokens = analyze('@himawari お腹ペコい #yryr');
		assert.deepEqual([
			{ type: 'mention', content: '@himawari', username: 'himawari' },
			{ type: 'text', content: ' お腹ペコい ' },
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

/*
	it('正しくコンパイルされる', () => {
		assert.equal(-1, [1,2,3].indexOf(4));
	});
*/
});
