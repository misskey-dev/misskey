/*
 * Tests of Maybe
 *
 * How to run the tests:
 * > mocha test/prelude/maybe.ts --require ts-node/register
 *
 * To specify test:
 * > mocha test/prelude/maybe.ts --require ts-node/register -g 'test name'
 */

import * as assert from 'assert';
import { just, nothing } from '../../src/prelude/maybe';

describe('Maybe', () => {
	it('just has a value', () => {
		assert.deepStrictEqual(just(3).isJust(), true);
	});

	it('nothing has no value', () => {
		assert.deepStrictEqual(nothing().isJust(), false);
	});

	it('get is the inverse of just', () => {
		assert.deepStrictEqual(just(3).get(), 3);
	});
});
