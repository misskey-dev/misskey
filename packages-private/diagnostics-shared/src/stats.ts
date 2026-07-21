/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export function median(values: number[]) {
	const sorted = values.toSorted((a, b) => a - b);
	const center = Math.floor(sorted.length / 2);
	if (sorted.length % 2 === 1) return sorted[center];
	return Math.round((sorted[center - 1] + sorted[center]) / 2);
}

export function mad(values: number[]) {
	if (values.length < 2) throw new Error('Not enough samples to calculate MAD');

	const center = median(values);
	return median(values.map(value => Math.abs(value - center)));
}

/**
 * 有限値のみを対象に中央値を求める。有限値が1つも無い場合は `defaultValue` を返す。
 */
export function finiteMedian(values: (number | null | undefined)[]): number | null;
export function finiteMedian(values: (number | null | undefined)[], defaultValue: number): number;
export function finiteMedian(values: (number | null | undefined)[], defaultValue: number | null = null) {
	const finiteValues = values.filter(value => Number.isFinite(value)) as number[];
	if (finiteValues.length === 0) return defaultValue;
	return median(finiteValues);
}

/**
 * サンプルのばらつき (MAD) を求める。サンプルが2つ未満で求められない場合は null を返す。
 */
export function sampleSpread(values: (number | null | undefined)[]) {
	const finiteValues = values.filter(value => Number.isFinite(value)) as number[];
	if (finiteValues.length < 2) return null;
	return mad(finiteValues);
}

export type IndependentDeltaVerdict = 'inconclusive' | 'within noise' | 'increase' | 'decrease';

export type IndependentDeltaSummary = {
	baseMedian: number | null;
	headMedian: number | null;
	delta: number | null;
	baseMad: number | null;
	headMad: number | null;
	combinedMad: number | null;
	baseSamples: number;
	headSamples: number;
	verdict: IndependentDeltaVerdict;
};

export type IndependentDeltaSummaryOptions = {
	forceInconclusive?: boolean;
};

function finiteSampleValues<T>(samples: T[], getValue: (sample: T) => number | null | undefined) {
	return samples
		.map(getValue)
		.filter((value): value is number => value != null && Number.isFinite(value));
}

export function independentDeltaSummary<T>(
	baseSamples: T[],
	headSamples: T[],
	getValue: (sample: T) => number | null | undefined,
	options: IndependentDeltaSummaryOptions = {},
): IndependentDeltaSummary {
	const baseValues = finiteSampleValues(baseSamples, getValue);
	const headValues = finiteSampleValues(headSamples, getValue);
	const baseMedian = finiteMedian(baseValues);
	const headMedian = finiteMedian(headValues);
	const delta = baseMedian == null || headMedian == null ? null : headMedian - baseMedian;
	const baseMad = sampleSpread(baseValues);
	const headMad = sampleSpread(headValues);
	const combinedMad = baseMad == null || headMad == null ? null : Math.hypot(baseMad, headMad);

	let verdict: IndependentDeltaVerdict;
	if (options.forceInconclusive === true || delta == null || combinedMad == null) {
		verdict = 'inconclusive';
	} else if (Math.abs(delta) <= combinedMad * 3) {
		verdict = 'within noise';
	} else {
		verdict = delta > 0 ? 'increase' : 'decrease';
	}

	return {
		baseMedian,
		headMedian,
		delta,
		baseMad,
		headMad,
		combinedMad,
		baseSamples: baseValues.length,
		headSamples: headValues.length,
		verdict,
	};
}

type RoundedSample = { round: number };

function indexByRound<T extends RoundedSample>(samples: T[]) {
	const samplesByRound = new Map<number, T>();
	for (const sample of samples) {
		// 負のroundはwarmupを表すため対象外
		if (sample.round <= 0) continue;
		samplesByRound.set(sample.round, sample);
	}
	return samplesByRound;
}

/**
 * base / head を同じroundどうしで突き合わせ、その差分の分布を要約する。
 * 実行順による揺らぎの影響を抑えるため、単純な集計値どうしの引き算ではなくペア差分を使う。
 */
export function pairedDeltaSummary<T extends RoundedSample>(baseSamples: T[], headSamples: T[], getValue: (sample: T) => number | null | undefined) {
	const baseSamplesByRound = indexByRound(baseSamples);
	const headSamplesByRound = indexByRound(headSamples);
	const values: number[] = [];

	for (const [round, baseSample] of baseSamplesByRound) {
		const headSample = headSamplesByRound.get(round);
		if (headSample == null) continue;

		const baseValue = getValue(baseSample);
		const headValue = getValue(headSample);
		if (baseValue == null || headValue == null) continue;

		values.push(headValue - baseValue);
	}

	// 対応するroundが1つも無いと中央値も最小/最大も定義できない。
	// 静かにNaNやInfinityをレポートに載せるより、比較が成立していないと分かる形で落とす
	if (values.length === 0) throw new Error('No paired samples to compare: base and head have no rounds in common');

	return {
		median: median(values),
		// 1サンプルでは中央値からの偏差が常に0になる (mad() は統計として無意味なので拒否する)
		mad: values.length < 2 ? 0 : mad(values),
		min: Math.min(...values),
		max: Math.max(...values),
		samples: values.length,
	};
}
