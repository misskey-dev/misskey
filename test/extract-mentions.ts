import * as assert from 'assert';

import extractMentions from '../src/misc/extract-mentions';
import { parse } from 'mfm-js';

describe('Extract mentions', () => {
	it('simple', () => {
		const ast = parse('@foo @bar @baz')!;
		const mentions = extractMentions(ast);
		assert.deepStrictEqual(mentions, [{
			username: 'foo',
			acct: '@foo',
			host: null
		}, {
			username: 'bar',
			acct: '@bar',
			host: null
		}, {
			username: 'baz',
			acct: '@baz',
			host: null
		}]);
	});

	it('nested', () => {
		const ast = parse('@foo **@bar** @baz')!;
		const mentions = extractMentions(ast);
		assert.deepStrictEqual(mentions, [{
			username: 'foo',
			acct: '@foo',
			host: null
		}, {
			username: 'bar',
			acct: '@bar',
			host: null
		}, {
			username: 'baz',
			acct: '@baz',
			host: null
		}]);
	});
});
