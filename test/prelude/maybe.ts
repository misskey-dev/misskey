/*
 * Tests of Maybe
 *
 * How to run the tests:
 * > npx mocha test/prelude/maybe.ts --require ts-node/register
 *
 * To specify test:
 * > npx mocha test/prelude/maybe.ts --require ts-node/register -g 'test name'
 */

import * as assert from 'assert';
import { just, nothing } from '../../src/prelude/maybe';

describe('just', () => {
	it('has a value', () => {
		assert.deepStrictEqual(just(3).isJust(), true);
	});

	it('has the inverse called get', () => {
		assert.deepStrictEqual(just(3).get(), 3);
	});
});

describe('nothing', () => {
	it('has no value', () => {
		assert.deepStrictEqual(nothing().isJust(), false);
	});
});
