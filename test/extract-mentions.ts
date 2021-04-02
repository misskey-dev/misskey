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
			canonical: '@foo',
			host: null
		}, {
			username: 'bar',
			acct: '@bar',
			canonical: '@bar',
			host: null
		}, {
			username: 'baz',
			acct: '@baz',
			canonical: '@baz',
			host: null
		}]);
	});

	it('nested', () => {
		const ast = parse('@foo **@bar** @baz')!;
		const mentions = extractMentions(ast);
		assert.deepStrictEqual(mentions, [{
			username: 'foo',
			acct: '@foo',
			canonical: '@foo',
			host: null
		}, {
			username: 'bar',
			acct: '@bar',
			canonical: '@bar',
			host: null
		}, {
			username: 'baz',
			acct: '@baz',
			canonical: '@baz',
			host: null
		}]);
	});
});
