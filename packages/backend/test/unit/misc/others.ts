/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, test, expect } from '@jest/globals';
import { contentDisposition } from '@/misc/content-disposition.js';

describe('misc:content-disposition', () => {
	test('inline', () => {
		expect(contentDisposition('inline', 'foo bar')).toBe('inline; filename=\"foo_bar\"; filename*=UTF-8\'\'foo%20bar');
	});
	test('attachment', () => {
		expect(contentDisposition('attachment', 'foo bar')).toBe('attachment; filename=\"foo_bar\"; filename*=UTF-8\'\'foo%20bar');
	});
	test('non ascii', () => {
		expect(contentDisposition('attachment', 'ファイル名')).toBe('attachment; filename=\"_____\"; filename*=UTF-8\'\'%E3%83%95%E3%82%A1%E3%82%A4%E3%83%AB%E5%90%8D');
	});
});
