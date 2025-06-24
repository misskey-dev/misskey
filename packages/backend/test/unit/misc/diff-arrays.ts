/*
 * SPDX-FileCopyrightText: hazelnoot and other Sharkey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { diffArrays, diffArraysSimple } from '@/misc/diff-arrays.js';

describe(diffArrays, () => {
	it('should return empty result when both inputs are null', () => {
		const result = diffArrays(null, null);
		expect(result.added).toHaveLength(0);
		expect(result.removed).toHaveLength(0);
	});

	it('should return empty result when both inputs are empty', () => {
		const result = diffArrays([], []);
		expect(result.added).toHaveLength(0);
		expect(result.removed).toHaveLength(0);
	});

	it('should remove before when after is empty', () => {
		const result = diffArrays([1, 2, 3], []);
		expect(result.added).toHaveLength(0);
		expect(result.removed).toEqual([1, 2, 3]);
	});

	it('should deduplicate before when after is empty', () => {
		const result = diffArrays([1, 1, 2, 2, 3], []);
		expect(result.added).toHaveLength(0);
		expect(result.removed).toEqual([1, 2, 3]);
	});

	it('should add after when before is empty', () => {
		const result = diffArrays([], [1, 2, 3]);
		expect(result.added).toEqual([1, 2, 3]);
		expect(result.removed).toHaveLength(0);
	});

	it('should deduplicate after when before is empty', () => {
		const result = diffArrays([], [1, 1, 2, 2, 3]);
		expect(result.added).toEqual([1, 2, 3]);
		expect(result.removed).toHaveLength(0);
	});

	it('should return diff when both have values', () => {
		const result = diffArrays(
			['a', 'b', 'c', 'd'],
			['a', 'c', 'e', 'f'],
		);
		expect(result.added).toEqual(['e', 'f']);
		expect(result.removed).toEqual(['b', 'd']);
	});
});

describe(diffArraysSimple, () => {
	it('should return false when both inputs are null', () => {
		const result = diffArraysSimple(null, null);
		expect(result).toBe(false);
	});

	it('should return false when both inputs are empty', () => {
		const result = diffArraysSimple([], []);
		expect(result).toBe(false);
	});

	it('should return true when before is populated and after is empty', () => {
		const result = diffArraysSimple([1, 2, 3], []);
		expect(result).toBe(true);
	});

	it('should return true when before is empty and after is populated', () => {
		const result = diffArraysSimple([], [1, 2, 3]);
		expect(result).toBe(true);
	});

	it('should return true when values have changed', () => {
		const result = diffArraysSimple(
			['a', 'a', 'b', 'c'],
			['a', 'b', 'c', 'd'],
		);
		expect(result).toBe(true);
	});

	it('should return false when values have not changed', () => {
		const result = diffArraysSimple(
			['a', 'a', 'b', 'c'],
			['a', 'b', 'c', 'c'],
		);
		expect(result).toBe(false);
	});
});
