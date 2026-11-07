/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test } from 'vitest';
import { tryParseUrl } from '@@/js/url.js';

describe('tryParseUrl', () => {
	test('parses an absolute URL', () => {
		expect(tryParseUrl('https://example.com/path')?.href).toBe('https://example.com/path');
	});

	test('parses a relative URL against a base URL', () => {
		expect(tryParseUrl('/path', 'https://example.com/base')?.href).toBe('https://example.com/path');
	});

	test('returns null for an invalid URL', () => {
		expect(tryParseUrl('https://[invalid')).toBeNull();
	});
});
