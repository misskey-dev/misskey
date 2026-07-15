/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test } from 'vitest';
import {
	findLegacyLogError,
	normalizeLogAttributes,
	serializeLogError,
} from '@/logging/LogNormalizer.js';

describe('LogNormalizer', () => {
	test('normalizes common non-JSON values', () => {
		expect(normalizeLogAttributes({
			date: new Date('2025-01-02T03:04:05.678Z'),
			bigint: 123n,
			infinity: Infinity,
			undefinedValue: undefined,
		})).toEqual({
			bigint: '123',
			date: '2025-01-02T03:04:05.678Z',
			infinity: 'Infinity',
			undefinedValue: '[Unsupported]: undefined',
		});
	});

	test('marks unsupported objects and invalid dates without throwing', () => {
		expect(normalizeLogAttributes({
			map: new Map([['key', 'value']]),
			invalidDate: new Date('invalid'),
		})).toEqual({
			invalidDate: '[Unsupported]: object access failed',
			map: '[Unsupported]: object',
		});
	});

	test('preserves __proto__ as a normal attribute key', () => {
		const value = JSON.parse('{"__proto__":{"nested":"value"},"large":"' + 'x'.repeat(100) + '"}') as Record<string, unknown>;
		const normalized = normalizeLogAttributes(value, { limits: { maxBytes: 64 } });

		expect(Object.keys(normalized)).toContain('__proto__');
		expect(normalized['__proto__']).toEqual({ nested: 'value' });
		expect(Object.getPrototypeOf(normalized)).toBeNull();
	});

	test('redacts sensitive fields recursively, including the Misskey i token', () => {
		expect(normalizeLogAttributes({
			i: 'top-level-token',
			request: {
				Authorization: 'bearer-token',
				password: 'password',
				nested: [{ api_key: 'api-key' }],
			},
			visible: 'value',
		})).toEqual({
			i: '[REDACTED]',
			request: {
				Authorization: '[REDACTED]',
				password: '[REDACTED]',
				nested: [{ api_key: '[REDACTED]' }],
			},
			visible: 'value',
		});
	});

	test('keeps cycles finite and marks depth and entry truncation', () => {
		const cycle: Record<string, unknown> = { value: 'ok' };
		cycle.self = cycle;

		expect(normalizeLogAttributes({
			cycle,
			deep: { level1: { level2: { level3: 'value' } } },
		}, {
			limits: { maxDepth: 2, maxEntries: 10 },
		})).toEqual({
			cycle: { self: '[Circular]', value: 'ok' },
			deep: { level1: '[Truncated]' },
		});
		expect(normalizeLogAttributes({ entries: { a: 1, b: 2, c: 3 } }, { limits: { maxEntries: 2 } })).toEqual({
			entries: { a: 1, b: 2, '[Truncated]': '[Truncated]' },
		});
	});

	test('uses the detailed profile while retaining the redaction policy', () => {
		const value = { level1: { level2: { level3: { level4: 'value' } } }, token: 'secret' };

		expect(normalizeLogAttributes(value, { limits: { maxDepth: 3 } })).toMatchObject({ level1: { level2: { level3: '[Truncated]' } }, token: '[REDACTED]' });
		expect(normalizeLogAttributes(value, { profile: 'detailed' })).toEqual({
			level1: { level2: { level3: { level4: 'value' } } },
			token: '[REDACTED]',
		});
	});

	test('keeps normalized attributes within the configured byte limit', () => {
		const normalized = normalizeLogAttributes({ first: 'a'.repeat(100), second: 'b'.repeat(100) }, { limits: { maxBytes: 32 } });

		expect(Buffer.byteLength(JSON.stringify(normalized), 'utf8')).toBeLessThanOrEqual(32);
	});

	test('truncates long multibyte strings without splitting characters', () => {
		const normalized = normalizeLogAttributes({ value: '😀'.repeat(100) }, { limits: { maxStringBytes: 16, maxBytes: 100 } });

		expect(Buffer.byteLength(JSON.stringify(normalized.value), 'utf8')).toBeLessThanOrEqual(16);
		expect(JSON.stringify(normalized.value)).not.toContain('�');
	});

	test('serializes Error and its cause consistently', () => {
		const cause = new Error('root cause');
		const error = new TypeError('outer error', { cause });

		expect(serializeLogError(error)).toMatchObject({
			type: 'TypeError',
			message: 'outer error',
			cause: {
				type: 'Error',
				message: 'root cause',
			},
		});
	});

	test('keeps serialized Error output within its byte limit', () => {
		const serialized = serializeLogError(new Error('a long message'), { limits: { maxBytes: 32 } });

		expect(serialized).toBeDefined();
		expect(Buffer.byteLength(JSON.stringify(serialized), 'utf8')).toBeLessThanOrEqual(32);
		expect(serializeLogError(new Error('message'), { limits: { maxBytes: 20 } })).toBeUndefined();
	});

	test('finds Error values in legacy data', () => {
		const error = new Error('legacy');

		expect(findLegacyLogError({ e: error })).toBe(error);
		expect(findLegacyLogError({ stack: 'not-an-error' })).toBeUndefined();
	});
});
