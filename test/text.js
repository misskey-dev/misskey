const assert = require('assert');

const analyze = require('../src/common/text');
//const complie = require('../src/web/app/common/scripts/text-compiler');

describe('Text', () => {
	it('正しく解析される', () => {
		const tokens = analyze('@himawari お腹ペコい #yryr');
		assert.deepEqual([
			{ type: 'mention', content: '@himawari', username: 'himawari' },
			{ type: 'text', content: ' お腹ペコい ' },
			{ type: 'hashtag', content: '#yryr', hashtag: 'yryr' }
		], tokens);
	});

/*
	it('正しくコンパイルされる', () => {
		assert.equal(-1, [1,2,3].indexOf(4));
	});
*/
});
