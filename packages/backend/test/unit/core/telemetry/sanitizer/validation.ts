/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test } from 'vitest';
import { isSpanId, isTraceId, isWithinObservabilityLimit } from '@/core/telemetry/sanitizer/validation.js';

describe('telemetry sanitizer validation', () => {
	test('bounds oversized data', () => {
		expect(isWithinObservabilityLimit({ value: 'あ'.repeat(100000) })).toBe(false);
	});

	test('allows data within the limit and fails closed on values that cannot be serialized', () => {
		// 上限側だけを固定すると、実装が常に false を返すようになっても気付けない。
		expect(isWithinObservabilityLimit({ value: 'ok' })).toBe(true);
		const circular: Record<string, unknown> = {};
		circular.self = circular;
		expect(isWithinObservabilityLimit(circular)).toBe(false);
	});

	test('accepts valid trace and span IDs', () => {
		expect(isTraceId('0123456789abcdef0123456789abcdef')).toBe(true);
		expect(isTraceId('0123456789ABCDEF0123456789ABCDEF')).toBe(true);
		expect(isSpanId('0123456789abcdef')).toBe(true);
		expect(isSpanId('0123456789ABCDEF')).toBe(true);
	});

	test('rejects malformed trace and span IDs', () => {
		expect(isTraceId('0123456789abcdef')).toBe(false);
		expect(isTraceId('g'.repeat(32))).toBe(false);
		expect(isTraceId(null)).toBe(false);
		expect(isSpanId('01234567')).toBe(false);
		expect(isSpanId('g'.repeat(16))).toBe(false);
		expect(isSpanId(null)).toBe(false);
	});

	test('rejects all-zero trace and span IDs', () => {
		expect(isTraceId('0'.repeat(32))).toBe(false);
		expect(isSpanId('0'.repeat(16))).toBe(false);
	});
});
