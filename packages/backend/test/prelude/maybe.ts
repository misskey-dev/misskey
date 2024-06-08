/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as assert from 'assert';
import { just, nothing } from '../../src/misc/prelude/maybe.js';

describe('just', () => {
	test('has a value', () => {
		assert.deepStrictEqual(just(3).isJust(), true);
	});

	test('has the inverse called get', () => {
		assert.deepStrictEqual(just(3).get(), 3);
	});
});

describe('nothing', () => {
	test('has no value', () => {
		assert.deepStrictEqual(nothing().isJust(), false);
	});
});
