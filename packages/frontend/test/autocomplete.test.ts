/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { assert, describe, test } from 'vitest';
import { searchEmoji } from '@/scripts/search-emoji.js';

describe('emoji autocomplete', () => {
	test('名前の完全一致は名前の前方一致より優先される', async () => {
		const result = searchEmoji('foooo', [{ emoji: ':foooo:', name: 'foooo' }, { emoji: ':foooobaaar:', name: 'foooobaaar' }]);
		assert.equal(result[0].emoji, ':foooo:');
	});

	test('名前の前方一致は名前の部分一致より優先される', async () => {
		const result = searchEmoji('baaa', [{ emoji: ':baaar:', name: 'baaar' }, { emoji: ':foooobaaar:', name: 'foooobaaar' }]);
		assert.equal(result[0].emoji, ':baaar:');
	});

	test('名前の完全一致はタグの完全一致より優先される', async () => {
		const result = searchEmoji('foooo', [{ emoji: ':foooo:', name: 'foooo' }, { emoji: ':baaar:', name: 'foooo', aliasOf: 'baaar' }]);
		assert.equal(result[0].emoji, ':foooo:');
	});

	test('名前の前方一致はタグの前方一致より優先される', async () => {
		const result = searchEmoji('foo', [{ emoji: ':foooo:', name: 'foooo' }, { emoji: ':baaar:', name: 'foooo', aliasOf: 'baaar' }]);
		assert.equal(result[0].emoji, ':foooo:');
	});

	test('名前の部分一致はタグの部分一致より優先される', async () => {
		const result = searchEmoji('oooo', [{ emoji: ':foooo:', name: 'foooo' }, { emoji: ':baaar:', name: 'foooo', aliasOf: 'baaar' }]);
		assert.equal(result[0].emoji, ':foooo:');
	});
});
