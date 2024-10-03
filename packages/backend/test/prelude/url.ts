/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as assert from 'assert';
import { query } from '../../src/misc/prelude/url.js';

describe('url', () => {
	test('query', () => {
		const s = query({
			foo: 'ふぅ',
			bar: 'b a r',
			baz: undefined,
		});
		assert.deepStrictEqual(s, 'foo=%E3%81%B5%E3%81%85&bar=b%20a%20r');
	});
});
