/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test } from 'vitest';
import { parseUlidFull } from '@/misc/id/ulid.js';

// Timestamp part "01KPS7S300" encodes 1776816000000ms (2026-04-22T00:00:00.000Z)
// Verified: 1*32^8 + 19*32^7 + 22*32^6 + 25*32^5 + 7*32^4 + 25*32^3 + 3*32^2 = 1776816000000

describe('misc:ulid', () => {
	test('parseUlidFull - timestamp is parsed correctly', () => {
		// id[10..25] = all zeros (valid Crockford Base32)
		// 2026-04-22T00:00:00.000Z
		const { date } = parseUlidFull('01KPS7S3000000000000000000');
		expect(date).toBe(1776816000000);
	});

	test('parseUlidFull - W/X/Y/Z at id[10] (chunk 1 head) do not throw', () => {
		// id[10] = W
		expect(() => parseUlidFull('01KPS7S300W000000000000000')).not.toThrow();
		// id[10] = X
		expect(() => parseUlidFull('01KPS7S300X000000000000000')).not.toThrow();
		// id[10] = Y
		expect(() => parseUlidFull('01KPS7S300Y000000000000000')).not.toThrow();
		// id[10] = Z
		expect(() => parseUlidFull('01KPS7S300Z000000000000000')).not.toThrow();
	});

	test('parseUlidFull - W/X/Y/Z at id[16] (chunk 2 head) do not throw', () => {
		// id[16] = W
		expect(() => parseUlidFull('01KPS7S300ABCDEFW000000000')).not.toThrow();
		// id[16] = X
		expect(() => parseUlidFull('01KPS7S300ABCDEFX000000000')).not.toThrow();
		// id[16] = Y
		expect(() => parseUlidFull('01KPS7S300ABCDEFY000000000')).not.toThrow();
		// id[16] = Z
		expect(() => parseUlidFull('01KPS7S300ABCDEFZ000000000')).not.toThrow();
	});

	test('parseUlidFull - additional exceeds uint64 max (all-Z randomness)', () => {
		// All 16 random chars = 'Z' (Crockford max) → 80-bit value > uint64 max
		const { additional } = parseUlidFull('01ARZ3NDEKZZZZZZZZZZZZZZZZ');
		const uint64Max = 2n ** 64n - 1n;
		expect(additional > uint64Max).toBe(true);
		expect(BigInt.asUintN(64, additional) <= uint64Max).toBe(true);
	});
});
