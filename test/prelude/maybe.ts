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
