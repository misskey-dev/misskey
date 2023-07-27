/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { checkWordMute } from '@/misc/check-word-mute.js';

describe(checkWordMute, () => {
	describe('Slacc boost mode', () => {
		it('should return false if mutedWords is empty', async () => {
			expect(await checkWordMute({ userId: '1', text: 'foo' }, null, [])).toBe(false);
		});
		it('should return true if mutedWords is not empty and text contains muted word', async () => {
			expect(await checkWordMute({ userId: '1', text: 'foo' }, null, [['foo']])).toBe(true);
		});
		it('should return false if mutedWords is not empty and text does not contain muted word', async () => {
			expect(await checkWordMute({ userId: '1', text: 'foo' }, null, [['bar']])).toBe(false);
		});
		it('should return false when the note is written by me even if mutedWords is not empty and text contains muted word', async () => {
			expect(await checkWordMute({ userId: '1', text: 'foo' }, { id: '1' }, [['foo']])).toBe(false);
		});
		it('should return true if mutedWords is not empty and text contains muted word in CW', async () => {
			expect(await checkWordMute({ userId: '1', text: 'foo', cw: 'bar' }, null, [['bar']])).toBe(true);
		});
		it('should return true if mutedWords is not empty and text contains muted word in both CW and text', async () => {
			expect(await checkWordMute({ userId: '1', text: 'foo', cw: 'bar' }, null, [['foo'], ['bar']])).toBe(true);
		});
		it('should return true if mutedWords is not empty and text does not contain muted word in both CW and text', async () => {
			expect(await checkWordMute({ userId: '1', text: 'foo', cw: 'bar' }, null, [['foo'], ['baz']])).toBe(true);
		});
	});
	describe('normal mode', () => {
		it('should return false if text does not contain muted words', async () => {
			expect(await checkWordMute({ userId: '1', text: 'foo' }, null, [['foo', 'bar']])).toBe(false);
		});
		it('should return true if text contains muted words', async () => {
			expect(await checkWordMute({ userId: '1', text: 'foobar' }, null, [['foo', 'bar']])).toBe(true);
		});
		it('should return false when the note is written by me even if text contains muted words', async () => {
			expect(await checkWordMute({ userId: '1', text: 'foo bar' }, { id: '1' }, [['foo', 'bar']])).toBe(false);
		});
	});
	describe('RegExp mode', () => {
		it('should return false if text does not contain muted words', async () => {
			expect(await checkWordMute({ userId: '1', text: 'foo' }, null, ['/bar/'])).toBe(false);
		});
		it('should return true if text contains muted words', async () => {
			expect(await checkWordMute({ userId: '1', text: 'foobar' }, null, ['/bar/'])).toBe(true);
		});
		it('should return false when the note is written by me even if text contains muted words', async () => {
			expect(await checkWordMute({ userId: '1', text: 'foo bar' }, { id: '1' }, ['/bar/'])).toBe(false);
		});
	});
});
