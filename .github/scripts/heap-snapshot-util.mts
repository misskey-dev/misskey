/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// NOTE: このファイルはworkflow上でバックエンドからも参照されるため、side effectがあってはならない

import * as util from './utility.mts';

export const heapSnapshotCategory = {
	total: { label: 'Total', color: 'gray', colorHex: '#888888' },
	code: { label: 'Code', color: 'orange', colorHex: '#f28e2c' },
	strings: { label: 'Strings', color: 'red', colorHex: '#e15759' },
	jsArrays: { label: 'JS arrays', color: 'cyan', colorHex: '#76b7b2' },
	typedArrays: { label: 'Typed arrays', color: 'green', colorHex: '#59a14f' },
	systemObjects: { label: 'System objects', color: 'yellow', colorHex: '#edc949' },
	otherJsObjects: { label: 'Other JS objs', color: 'violet', colorHex: '#af7aa1' },
	otherNonJsObjects: { label: 'Other non-JS objs', color: 'pink', colorHex: '#ff9da7' },
} as const satisfies Record<string, { label: string; color: string; colorHex: string }>;

export type HeapSnapshotData = {
	categories: Record<keyof typeof heapSnapshotCategory, number>;
	nodeCounts: Record<keyof typeof heapSnapshotCategory, number>;
	breakdowns?: Record<keyof typeof heapSnapshotCategory, Record<string, number>>;
};

export type HeapSnapshotReport = {
	summary: HeapSnapshotData;
	samples: {
		round: number;
		data: HeapSnapshotData;
	}[];
};

function getHeapSnapshotCategoryValue(report: HeapSnapshotReport, category: keyof typeof heapSnapshotCategory) {
	return report.summary.categories[category];
}

export function renderHeapSnapshotTable(base: HeapSnapshotReport, head: HeapSnapshotReport) {
	const lines = [
		'| Metric | Base | Head | Δ median | Δ MAD | Δ min | Δ max |',
		'| --- | ---: | ---: | ---: | ---: | ---: | ---: |',
	];
	const baseTotal = getHeapSnapshotCategoryValue(base, 'total');
	const headTotal = getHeapSnapshotCategoryValue(head, 'total');

	function getHeapSnapshotSampleSpread(report: HeapSnapshotReport, category: keyof typeof heapSnapshotCategory) {
		const values = report.samples
			.map(sample => sample.data.categories[category])
			.filter(value => Number.isFinite(value)) as number[];
		if (values.length < 2) throw new Error(`Not enough samples for category ${category}`);

		const center = util.median(values);
		return util.median(values.map(value => Math.abs(value - center)));
	}

	for (const category of Object.keys(heapSnapshotCategory) as (keyof typeof heapSnapshotCategory)[]) {
		const baseValue = getHeapSnapshotCategoryValue(base, category);
		const headValue = getHeapSnapshotCategoryValue(head, category);
		const baseSpread = getHeapSnapshotSampleSpread(base, category);
		const headSpread = getHeapSnapshotSampleSpread(head, category);
		const summary = util.pairedDeltaSummary(base.samples, head.samples, (sample) => sample.data.categories[category]);
		const percent = summary.median * 100 / baseValue;

		if (category === 'total') {
			const deltaMedian = `${util.formatDeltaBytes(summary.median)}<br>${util.formatDeltaPercent(percent).replaceAll('\\%', '\\\\%')}`;
			const baseText = `${util.formatBytes(baseValue)} <br> ± ${util.formatBytes(baseSpread)}`;
			const headText = `${util.formatBytes(headValue)} <br> ± ${util.formatBytes(headSpread)}`;
			const metricText = `$\\color{${heapSnapshotCategory[category].color}}{\\rule{8pt}{8pt}}$ **${heapSnapshotCategory[category].label}**`;
			lines.push(`| ${metricText} | ${baseText} | ${headText} | ${deltaMedian} | ${util.formatBytes(summary.mad)} | ${util.formatDeltaBytes(summary.min)} | ${util.formatDeltaBytes(summary.max)} |`);
			lines.push('| | | | | | | |');
		} else {
			const deltaMedian = util.formatDeltaBytes(summary.median);
			const baseText = util.formatBytes(baseValue);
			const headText = util.formatBytes(headValue);
			const basePercent = util.formatPercent((baseValue * 100) / baseTotal);
			const headPercent = util.formatPercent((headValue * 100) / headTotal);
			const metricText = `<details><summary>$\\color{${heapSnapshotCategory[category].color}}{\\rule{8pt}{8pt}}$ **${heapSnapshotCategory[category].label}**</summary>${basePercent} → ${headPercent}</details>`;
			lines.push(`| ${metricText} | ${baseText} | ${headText} | ${deltaMedian} | ${util.formatBytes(summary.mad)} | ${util.formatDeltaBytes(summary.min)} | ${util.formatDeltaBytes(summary.max)} |`);
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
	const total = getHeapSnapshotCategoryValue(report, 'total');
	if (total == null || total <= 0) return null;

	function getHeapSnapshotBreakdownEntries(category: keyof typeof heapSnapshotCategory) {
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

	const categories = (Object.keys(heapSnapshotCategory) as (keyof typeof heapSnapshotCategory)[])
		.filter(category => category !== 'total')
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
		[title]: heapSnapshotCategory.total.colorHex,
	} as Record<string, string>;
	for (const { category, childEntries } of categories) {
		const categoryColor = heapSnapshotCategory[category].colorHex;
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
		lines.push(`${escapeCsvValue(title)},${escapeCsvValue(heapSnapshotCategory[category].label)},${formatSankeyPercentValue(percent)}`);

		for (const [childName, childPercent] of childEntries) {
			lines.push(`${escapeCsvValue(heapSnapshotCategory[category].label)},${escapeCsvValue(childName)},${formatSankeyPercentValue(childPercent)}`);
		}
	}

	lines.push('```');
	lines.push('');
	lines.push('</details>');

	return lines.join('\n');
}
