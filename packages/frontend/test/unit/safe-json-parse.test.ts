/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test, vi } from 'vitest';

import { safeJsonParse } from '@/utility/safe-json-parse.js';

describe('safeJsonParse', () => {
	test('valid JSON is parsed', () => {
		expect(safeJsonParse('{"a":1}', {})).toEqual({ a: 1 });
		expect(safeJsonParse('[1,2]', [])).toEqual([1, 2]);
	});

	test('null / undefined returns fallback without calling onError', () => {
		const onError = vi.fn();
		expect(safeJsonParse(null, 'fallback', onError)).toBe('fallback');
		expect(safeJsonParse(undefined, 'fallback', onError)).toBe('fallback');
		expect(onError).not.toHaveBeenCalled();
	});

	test('invalid JSON returns fallback and calls onError', () => {
		const onError = vi.fn();
		expect(safeJsonParse('{invalid', 'fallback', onError)).toBe('fallback');
		expect(safeJsonParse('', 'fallback', onError)).toBe('fallback');
		expect(onError).toHaveBeenCalledTimes(2);
		expect(onError.mock.calls[0][0]).toBeInstanceOf(SyntaxError);
	});
});
