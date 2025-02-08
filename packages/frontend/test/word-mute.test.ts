/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, test, assert } from 'vitest';
import { createWordMuteInfo, checkWordMute } from '@/scripts/check-word-mute.js';
import { NoteMock } from './mocks.js';

type TestCases = {
	text: string,
	cw?: string,
	mutedWords: Array<string | string[]>,
	result: false | Array<string | string[]>,
}

describe('check-word-mute', () => {
	const cases:Array<TestCases> = [
		{
			text: 'Hello, Misskey!',
			mutedWords: ['Misskey'],
			result: [['Misskey']],
		},
		// cw
		{
			text: 'Hello, Misskey!',
			cw: 'ai',
			mutedWords: ['ai'],
			result: [['ai']],
		},
		// nothing
		{
			text: 'Hello, Misskey!',
			mutedWords: [],
			result: false,
		},
		// surrogate pair
		{
			text: '𠮟る',
			mutedWords: ['𠮟'],
			result: [['𠮟']],
		},
		// grapheme cluster
		{
			text: '👩‍❤️‍👨',
			mutedWords: ['👩'],
			result: false,
		},
		// regex
		{
			text: 'Hello, Misskey!',
			mutedWords: ['/M[isk]*ey/'],
			result: ['/M[isk]*ey/'],
		},
		// multi wordas
		{
			text: 'Hello, Misskey!',
			mutedWords: [['Hello', 'Misskey'], ['Mi']],
			result: [['Mi'],['Hello', 'Misskey']],
		},
	]

	cases.forEach((c) => {
		test(`text: ${c.text}, cw: ${c.cw}, mutedWords: ${c.mutedWords}` , async () => {
			// initWordMuteInfoが実行されないので代わりにここで初期化
			(globalThis as any)._misskeyWordMute = {
				soft: createWordMuteInfo(c.mutedWords),
				hard: createWordMuteInfo([]),
			}

			const note = NoteMock({ text: c.text, cw: c.cw });
			const result = checkWordMute(note, null, 'soft');
			assert.deepEqual(result, c.result);
		});
	});
});
