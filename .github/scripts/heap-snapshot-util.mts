/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// NOTE: このファイルはworkflow上でバックエンドからも参照されるため、side effectがあってはならない

import * as util from './utility.mts';

export const heapSnapshotCategories = [
	'Total',
	'Code',
	'Strings',
	'JS arrays',
	'Typed arrays',
	'System objects',
	'Other JS objects',
	'Other non-JS objects',
] as const;

const heapSnapshotCategoriesColors = {
	'Total': 'gray',
	'Code': 'orange',
	'Strings': 'red',
	'JS arrays': 'cyan',
	'Typed arrays': 'green',
	'System objects': 'yellow',
	'Other JS objects': 'violet',
	'Other non-JS objects': 'pink',
} as const satisfies Record<typeof heapSnapshotCategories[number], string>;

const heapSnapshotCategoriesColorsHex = {
	'Total': '#888888',
	'Code': '#f28e2c',
	'Strings': '#e15759',
	'JS arrays': '#76b7b2',
	'Typed arrays': '#59a14f',
	'System objects': '#edc949',
	'Other JS objects': '#af7aa1',
	'Other non-JS objects': '#ff9da7',
} as const satisfies Record<typeof heapSnapshotCategories[number], string>;

export type HeapSnapshotData = {
	categories: Record<typeof heapSnapshotCategories[number], number>;
	nodeCounts: Record<typeof heapSnapshotCategories[number], number>;
	breakdowns?: Record<typeof heapSnapshotCategories[number], Record<string, number>>;
};

export type HeapSnapshotReport = {
	summary: HeapSnapshotData;
	samples: {
		round: number;
		data: HeapSnapshotData;
	}[];
};

function getHeapSnapshotCategoryValue(report: HeapSnapshotReport, category: typeof heapSnapshotCategories[number]) {
	return report.summary.categories[category];
}

export function renderHeapSnapshotTable(base: HeapSnapshotReport, head: HeapSnapshotReport) {
	const lines = [
		'| Metric | Base | Head | Δ median | Δ MAD | Δ min | Δ max |',
		'| --- | ---: | ---: | ---: | ---: | ---: | ---: |',
	];
	const baseTotal = getHeapSnapshotCategoryValue(base, 'Total');
	const headTotal = getHeapSnapshotCategoryValue(head, 'Total');

	function getHeapSnapshotSampleSpread(report: HeapSnapshotReport, category: typeof heapSnapshotCategories[number]) {
		const values = report.samples
			.map(sample => sample.data.categories[category])
			.filter(value => Number.isFinite(value)) as number[];
		if (values.length < 2) throw new Error(`Not enough samples for category ${category}`);

		const center = util.median(values);
		return util.median(values.map(value => Math.abs(value - center)));
	}

	for (const category of heapSnapshotCategories) {
		const baseValue = getHeapSnapshotCategoryValue(base, category);
		const headValue = getHeapSnapshotCategoryValue(head, category);
		const baseSpread = getHeapSnapshotSampleSpread(base, category);
		const headSpread = getHeapSnapshotSampleSpread(head, category);
		const summary = util.pairedDeltaSummary(base.samples, head.samples, (sample) => sample.data.categories[category]);
		const percent = summary.median * 100 / baseValue;
		const deltaMedian = category === 'Total' ? `${util.formatDeltaBytes(summary.median)}<br>${util.formatDeltaPercent(percent).replaceAll('\\%', '\\\\%')}` :  util.formatDeltaBytes(summary.median);
		const baseText = category === 'Total' ? `${util.formatBytes(baseValue)} <br> ± ${util.formatBytes(baseSpread)}` : util.formatBytes(baseValue);
		const headText = category === 'Total' ? `${util.formatBytes(headValue)} <br> ± ${util.formatBytes(headSpread)}` : util.formatBytes(headValue);
		const basePercent = util.formatPercent((baseValue * 100) / baseTotal);
		const headPercent = util.formatPercent((headValue * 100) / headTotal);
		const metricText = category === 'Total'
			? `$\\color{${heapSnapshotCategoriesColors[category]}}{\\rule{8pt}{8pt}}$ **${category}**`
			: `<details><summary>$\\color{${heapSnapshotCategoriesColors[category]}}{\\rule{8pt}{8pt}}$ **${category}**</summary>${basePercent} → ${headPercent}</details>`;

		lines.push(`| ${metricText} | ${baseText} | ${headText} | ${deltaMedian} | ${util.formatBytes(summary.mad)} | ${util.formatDeltaBytes(summary.min)} | ${util.formatDeltaBytes(summary.max)} |`);
		if (category === 'Total') {
			lines.push('| | | | | | | |');
		}
	}

	if (lines.length === 2) return null;
	return lines.join('\n');
}

const heapSnapshotSankeyChildMinRatio = 0.3;
const heapSnapshotSankeyParentMinPercent = 10;

function escapeCsvValue(value: string) {
	return `"${String(value).replaceAll('"', '""')}"`;
}

export function renderHeapSnapshotSankey(report: HeapSnapshotReport, title: string) {
	const total = getHeapSnapshotCategoryValue(report, 'Total');
	if (total == null || total <= 0) return null;

	function getHeapSnapshotBreakdownEntries(category: typeof heapSnapshotCategories[number]) {
		const breakdown = report.summary.breakdowns?.[category];
		if (breakdown == null || typeof breakdown !== 'object') return [];

		return Object.entries(breakdown)
			.filter(([, value]) => Number.isFinite(value) && value > 0)
			.toSorted((a, b) => b[1] - a[1]);
	}

	function formatHeapSnapshotSankeyChildLabel(label: string) {
		return String(label).replace(/^[^:]+:\s*/, '');
	}

	function formatSankeyPercentValue(value: number) {
		const rounded = Math.round(value * 100) / 100;
		if (rounded === 0 && value > 0) return '0.01';
		if (Number.isInteger(rounded)) return String(rounded);
		return rounded.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
	}

	const categories = heapSnapshotCategories
		.filter(category => category !== 'Total')
		.map(category => {
			const value = getHeapSnapshotCategoryValue(report, category);
			if (value == null || value <= 0) return null;
			const breakdownEntries = getHeapSnapshotBreakdownEntries(category);
			const breakdownTotal = breakdownEntries.reduce((sum, [, childValue]) => sum + childValue, 0);
			const percent = (value * 100) / total;
			const childEntries = [];
			let otherPercent = 0;

			if (breakdownTotal > 0 && percent > heapSnapshotSankeyParentMinPercent) {
				for (const [childName, childValue] of breakdownEntries) {
					const childRatio = childValue / breakdownTotal;
					const childPercent = percent * childRatio;
					if (childRatio >= heapSnapshotSankeyChildMinRatio) {
						childEntries.push([formatHeapSnapshotSankeyChildLabel(childName), childPercent]);
					} else {
						otherPercent += childPercent;
					}
				}

				if (childEntries.length > 0 && otherPercent > 0) {
					childEntries.push(['Other', otherPercent]);
				}
			}

			return {
				category,
				percent,
				childEntries,
			};
		})
		.filter(value => value != null);

	if (categories.length === 0) return null;

	const nodeColors = {
		[title]: heapSnapshotCategoriesColorsHex.Total,
	} as Record<string, string>;
	for (const { category, childEntries } of categories) {
		const categoryColor = heapSnapshotCategoriesColorsHex[category] ?? heapSnapshotCategoriesColorsHex.Total;
		nodeColors[category] = categoryColor;

		for (const [childName] of childEntries) {
			nodeColors[childName] = categoryColor;
		}
	}

	const lines = [
		`<details><summary>${title} heap snapshot composition</summary>`,
		'',
		'```mermaid',
		`%%{init: ${JSON.stringify({
			sankey: {
				showValues: false,
				linkColor: 'target',
				labelStyle: 'outlined',
				nodeAlignment: 'center',
				nodePadding: 10,
				nodeColors: {
					...nodeColors,
					'Other': '#888888',
				},
			},
		})}}%%`,
		'sankey-beta',
	];

	for (const { category, percent, childEntries } of categories) {
		lines.push(`${escapeCsvValue(title)},${escapeCsvValue(category)},${formatSankeyPercentValue(percent)}`);

		for (const [childName, childPercent] of childEntries) {
			lines.push(`${escapeCsvValue(category)},${escapeCsvValue(childName)},${formatSankeyPercentValue(childPercent)}`);
		}
	}

	lines.push('```');
	lines.push('');
	lines.push('</details>');

	return lines.join('\n');
}
