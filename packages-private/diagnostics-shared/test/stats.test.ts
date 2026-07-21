/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test } from 'vitest';
import { finiteMedian, independentDeltaSummary, mad, median, pairedDeltaSummary, sampleSpread } from '../src/stats';

describe('median', () => {
	test('takes the middle value of an odd-length sample', () => {
		expect(median([3, 1, 2])).toBe(2);
	});

	// 偶数長では平均を整数に丸める。KiB単位の整数値を扱う前提のため
	test('rounds the average of an even-length sample', () => {
		expect(median([1, 2])).toBe(2);
		expect(median([1, 4])).toBe(3);
	});
});

describe('mad', () => {
	test('measures the median absolute deviation', () => {
		expect(mad([1, 1, 1])).toBe(0);
		expect(mad([1, 2, 3])).toBe(1);
	});

	test('refuses to compute from a single sample', () => {
		expect(() => mad([1])).toThrow();
	});
});

describe('finiteMedian', () => {
	test('ignores non-finite entries', () => {
		expect(finiteMedian([1, null, undefined, Number.NaN, 3])).toBe(2);
	});

	test('returns null by default when nothing is finite', () => {
		expect(finiteMedian([null, undefined])).toBeNull();
	});

	test('returns the supplied default when nothing is finite', () => {
		expect(finiteMedian([null, undefined], 0)).toBe(0);
	});
});

describe('sampleSpread', () => {
	test('needs at least two finite samples', () => {
		expect(sampleSpread([1])).toBeNull();
		expect(sampleSpread([1, null])).toBeNull();
		expect(sampleSpread([1, 3])).toBe(1);
	});
});

describe('pairedDeltaSummary', () => {
	const base = [
		{ round: 1, value: 100 },
		{ round: 2, value: 200 },
		{ round: 3, value: 300 },
	];

	test('compares base and head within the same round', () => {
		const head = [
			{ round: 1, value: 110 },
			{ round: 2, value: 230 },
			{ round: 3, value: 320 },
		];

		expect(pairedDeltaSummary(base, head, sample => sample.value)).toStrictEqual({
			median: 20,
			mad: 10,
			min: 10,
			max: 30,
			samples: 3,
		});
	});

	test('drops rounds that only one side has', () => {
		const head = [
			{ round: 1, value: 110 },
			{ round: 2, value: 230 },
			{ round: 9, value: 999 },
		];

		expect(pairedDeltaSummary(base, head, sample => sample.value).samples).toBe(2);
	});

	// 1サンプルでも中央値・最小・最大は定まる (偏差は常に0)
	test('summarizes a single paired round without treating MAD as an error', () => {
		expect(pairedDeltaSummary([base[0]], [{ round: 1, value: 130 }], sample => sample.value)).toStrictEqual({
			median: 30,
			mad: 0,
			min: 30,
			max: 30,
			samples: 1,
		});
	});

	test('fails loudly when no round is shared', () => {
		expect(() => pairedDeltaSummary(base, [{ round: 9, value: 1 }], sample => sample.value)).toThrow(/no rounds in common/);
	});

	// 負のroundはwarmupを表すので集計に混ぜない
	test('ignores warmup rounds', () => {
		const warmupBase = [{ round: -1, value: 0 }, ...base];
		const warmupHead = [{ round: -1, value: 9999 }, { round: 1, value: 110 }, { round: 2, value: 230 }, { round: 3, value: 320 }];

		expect(pairedDeltaSummary(warmupBase, warmupHead, sample => sample.value).samples).toBe(3);
	});
});

describe('independentDeltaSummary', () => {
	const base = [290_000, 292_900, 295_800, 298_700, 301_600]
		.map((value, index) => ({ round: index + 1, value }));
	const head = [292_900, 296_300, 298_700, 301_600, 290_000]
		.map((value, index) => ({ round: index + 1, value }));

	test('uses the difference of independent medians instead of the paired median', () => {
		expect(pairedDeltaSummary(base, head, sample => sample.value).median).toBe(2_900);

		const summary = independentDeltaSummary(base, head, sample => sample.value);
		expect(summary).toMatchObject({
			baseMedian: 295_800,
			headMedian: 296_300,
			delta: 500,
			baseMad: 2_900,
			headMad: 3_400,
			baseSamples: 5,
			headSamples: 5,
			verdict: 'within noise',
		});
		expect(summary.combinedMad).toBeCloseTo(Math.hypot(2_900, 3_400));
	});

	test('allows unequal sample counts and ignores non-finite values', () => {
		const summary = independentDeltaSummary(
			[{ value: 10 }, { value: 20 }, { value: Number.NaN }],
			[{ value: 20 }, { value: 30 }, { value: 40 }],
			sample => sample.value,
		);

		expect(summary).toMatchObject({
			baseMedian: 15,
			headMedian: 30,
			delta: 15,
			baseSamples: 2,
			headSamples: 3,
			verdict: 'within noise',
		});
	});

	test('returns inconclusive without throwing when either side has fewer than two values', () => {
		expect(independentDeltaSummary(
			[{ value: 10 }],
			[{ value: 20 }, { value: 20 }],
			sample => sample.value,
		)).toStrictEqual({
			baseMedian: 10,
			headMedian: 20,
			delta: 10,
			baseMad: null,
			headMad: 0,
			combinedMad: null,
			baseSamples: 1,
			headSamples: 2,
			verdict: 'inconclusive',
		});
	});

	test('classifies clear increases and decreases when MAD is zero', () => {
		expect(independentDeltaSummary(
			[{ value: 10 }, { value: 10 }],
			[{ value: 11 }, { value: 11 }],
			sample => sample.value,
		).verdict).toBe('increase');

		expect(independentDeltaSummary(
			[{ value: 10 }, { value: 10 }],
			[{ value: 9 }, { value: 9 }],
			sample => sample.value,
		).verdict).toBe('decrease');
	});

	test('can force a statistically sufficient result to inconclusive', () => {
		expect(independentDeltaSummary(
			[{ value: 10 }, { value: 10 }],
			[{ value: 20 }, { value: 20 }],
			sample => sample.value,
			{ forceInconclusive: true },
		).verdict).toBe('inconclusive');
	});
});
