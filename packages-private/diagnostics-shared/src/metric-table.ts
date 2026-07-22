/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { formatColoredDelta, formatDeltaPercentInMdTable } from './format';
import {
	independentDeltaSummary,
	isOutsideObservedNoise,
	type IndependentDeltaSummary,
} from './stats';

export type MetricComparisonRow<T> = {
	label: string;
	getValue: (sample: T) => number;
	formatValue: (value: number) => string;
	absoluteThreshold: number;
	showMedianMad?: boolean;
	showDeltaPercentage?: boolean;
	separatorAfter?: boolean;
};

export type MetricComparisonTableOptions = {
	onlySignificantChanges?: boolean;
};

function isSignificant(summary: IndependentDeltaSummary, absoluteThreshold: number) {
	return isOutsideObservedNoise(summary) && Math.abs(summary.delta) >= absoluteThreshold;
}

function formatMedian<T>(
	value: number,
	spread: number,
	row: MetricComparisonRow<T>,
) {
	const formatted = row.formatValue(value);
	if (row.showMedianMad === false) return formatted;
	return `${formatted} <br> ± ${row.formatValue(spread)}`;
}

function formatDelta<T>(
	summary: IndependentDeltaSummary,
	row: MetricComparisonRow<T>,
	significant: boolean,
) {
	const colorThreshold = significant ? 0 : Number.POSITIVE_INFINITY;
	const absolute = formatColoredDelta(summary.delta, row.formatValue, colorThreshold);
	if (row.showDeltaPercentage === false) return absolute;

	const percentage = summary.baseMedian === 0
		? '-'
		: formatDeltaPercentInMdTable(summary.delta * 100 / summary.baseMedian, colorThreshold);
	return `${absolute}<br>${percentage}`;
}

export function renderMetricComparisonTable<T>(
	baseSamples: T[],
	headSamples: T[],
	rows: MetricComparisonRow<T>[],
	options: MetricComparisonTableOptions = {},
): string {
	const lines: string[] = [];
	let omitted = false;

	for (const row of rows) {
		const summary = independentDeltaSummary(baseSamples, headSamples, row.getValue);
		const significant = isSignificant(summary, row.absoluteThreshold);
		if (options.onlySignificantChanges === true && !significant) {
			omitted = true;
			continue;
		}

		lines.push(`| ${row.label} | ${formatMedian(summary.baseMedian, summary.baseMad, row)} | ${formatMedian(summary.headMedian, summary.headMad, row)} | ${formatDelta(summary, row, significant)} | ${row.formatValue(summary.combinedMad)} |`);
		if (row.separatorAfter === true) lines.push('| | | | | |');
	}

	if (lines.length === 0) return '**(No significant changes)**';

	return [
		'| Metric | @ Base | @ Head | Δ | MAD |',
		'| --- | ---: | ---: | ---: | ---: |',
		...lines,
		...(omitted ? ['', '<small><i>Only metrics showing significant changes are displayed.</i></small>'] : []),
	].join('\n');
}
