/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test } from 'vitest';
import {
	renderMetricComparisonTable,
	type MetricComparisonRow,
} from '../src/metric-table';

type Sample = { value: number };

const defaultRow: MetricComparisonRow<Sample> = {
	label: '<strong>Metric</strong>',
	getValue: sample => sample.value,
	formatValue: value => `${value} units`,
	absoluteThreshold: 10,
};

function samples(...values: number[]): Sample[] {
	return values.map(value => ({ value }));
}

describe('renderMetricComparisonTable', () => {
	test('renders the fixed five-column layout, raw label, MAD, and percentage by default', () => {
		const table = renderMetricComparisonTable(
			samples(100, 100, 100),
			samples(120, 120, 120),
			[defaultRow],
		);

		expect(table.split('\n')).toStrictEqual([
			'| Metric | @ Base | @ Head | Δ | MAD |',
			'| --- | ---: | ---: | ---: | ---: |',
			'| <strong>Metric</strong> | 100 units <br> ± 0 units | 120 units <br> ± 0 units | $\\color{orange}{\\text{+20 units}}$<br>$\\color{orange}{\\text{+20\\\\%}}$ | 0 units |',
		]);
	});

	test('can hide second lines and insert a five-column separator row', () => {
		const table = renderMetricComparisonTable(
			samples(100, 100, 100),
			samples(120, 120, 120),
			[{
				...defaultRow,
				showMedianMad: false,
				showDeltaPercentage: false,
				separatorAfter: true,
			}],
		);

		expect(table.split('\n')).toStrictEqual([
			'| Metric | @ Base | @ Head | Δ | MAD |',
			'| --- | ---: | ---: | ---: | ---: |',
			'| <strong>Metric</strong> | 100 units | 120 units | $\\color{orange}{\\text{+20 units}}$ | 0 units |',
			'| | | | | |',
		]);
	});

	test('leaves both delta lines uncolored below the absolute threshold and can filter the row', () => {
		const base = samples(100, 100, 100);
		const head = samples(109, 109, 109);
		const table = renderMetricComparisonTable(base, head, [defaultRow]);

		expect(table).toContain('$\\text{+9 units}$<br>$\\text{+9\\\\%}$');
		expect(table).not.toContain('\\color{');
		expect(renderMetricComparisonTable(base, head, [defaultRow], {
			onlySignificantChanges: true,
		})).toBe('**(No significant changes)**');
	});

	test('renders a no-data marker when no rows are configured', () => {
		expect(renderMetricComparisonTable(
			samples(100, 100, 100),
			samples(120, 120, 120),
			[],
		)).toBe('**(No significant changes)**');
	});

	test('treats the absolute threshold itself as significant', () => {
		const table = renderMetricComparisonTable(
			samples(100, 100, 100),
			samples(110, 110, 110),
			[defaultRow],
			{ onlySignificantChanges: true },
		);

		expect(table).toContain('$\\color{orange}{\\text{+10 units}}$');
		expect(table).toContain('$\\color{orange}{\\text{+10\\\\%}}$');
	});

	test('requires the delta to be strictly outside three combined MADs', () => {
		const inside = renderMetricComparisonTable(
			samples(100, 110, 120),
			samples(109, 119, 129),
			[{ ...defaultRow, absoluteThreshold: 1 }],
		);
		const boundary = renderMetricComparisonTable(
			samples(100, 100, 100),
			samples(120, 130, 140),
			[defaultRow],
		);
		const outside = renderMetricComparisonTable(
			samples(100, 100, 100),
			samples(121, 131, 141),
			[defaultRow],
		);

		expect(inside).toContain('$\\text{+9 units}$');
		expect(inside).not.toContain('\\color{');
		expect(boundary).toContain('$\\text{+30 units}$');
		expect(boundary).not.toContain('\\color{');
		expect(outside).toContain('$\\color{orange}{\\text{+31 units}}$');
		expect(outside).toContain('$\\color{orange}{\\text{+31\\\\%}}$');
	});

	test('colours a significant decrease green on both delta lines', () => {
		const table = renderMetricComparisonTable(
			samples(120, 120, 120),
			samples(100, 100, 100),
			[defaultRow],
		);

		expect(table).toContain('$\\color{green}{\\text{-20 units}}$');
		expect(table).toContain('$\\color{green}{\\text{-16.7\\\\%}}$');
	});

	test('shows a dash for percentage when the base median is zero', () => {
		const table = renderMetricComparisonTable(
			samples(0, 0, 0),
			samples(20, 20, 20),
			[defaultRow],
		);

		expect(table).toContain('$\\color{orange}{\\text{+20 units}}$<br>-');
	});

	test('propagates the minimum sample contract', () => {
		expect(() => renderMetricComparisonTable(
			samples(100),
			samples(120, 120),
			[defaultRow],
		)).toThrow('At least two samples per side are required');
	});
});
