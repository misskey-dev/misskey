/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, test, assert } from 'vitest';
import { groupAvatarDecorations, sortAvatarDecorationCategories } from '@/utility/group-avatar-decorations.js';

describe('groupAvatarDecorations', () => {
	test('keeps the order of decorations within a category', () => {
		const grouped = groupAvatarDecorations([
			{ id: 'a', category: 'x' },
			{ id: 'b', category: null },
			{ id: 'c', category: 'x' },
		]);
		assert.deepEqual(grouped['x'].map(d => d.id), ['a', 'c']);
		assert.deepEqual(grouped[''].map(d => d.id), ['b']);
	});
});

describe('sortAvatarDecorationCategories', () => {
	test('sorts by name with numeric ordering', () => {
		assert.deepEqual(
			sortAvatarDecorationCategories(['09. 季節', '10. その他', '01. フレーム', '02. 衣装', '99. 限定']),
			['01. フレーム', '02. 衣装', '09. 季節', '10. その他', '99. 限定'],
		);
		assert.deepEqual(sortAvatarDecorationCategories(['10', '9', '1']), ['1', '9', '10']);
	});

	test('puts the uncategorized group last', () => {
		assert.deepEqual(sortAvatarDecorationCategories(['b', '', 'a']), ['a', 'b', '']);
	});

	test('does not mutate the input', () => {
		const input = ['b', 'a'];
		sortAvatarDecorationCategories(input);
		assert.deepEqual(input, ['b', 'a']);
	});
});
