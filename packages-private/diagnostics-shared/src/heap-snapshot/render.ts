/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { formatBytes } from '../format';
import { renderMetricComparisonTable } from '../metric-table';
import {
	heapSnapshotCategories,
	heapSnapshotCategory,
	type HeapSnapshotCategory,
	type HeapSnapshotReport,
} from './categories';

/** これ未満のバイト差分には色を付けない (0.1 MB) */
const byteColorThreshold = 100_000;

function categoryValue(report: HeapSnapshotReport, category: HeapSnapshotCategory) {
	return report.summary.categories[category];
}

function swatch(category: HeapSnapshotCategory) {
	// eslint-disable-next-line no-irregular-whitespace
	return `$\\color{${heapSnapshotCategory[category].color}}{\\rule{8pt}{8pt}}$\u00A0**${heapSnapshotCategory[category].label.replaceAll(' ', '\u00A0')}**`; // nbspにすること
}

/**
 * base / head のheap snapshotをカテゴリ別に比較するMarkdownテーブルを描画する。
 */
export function renderHeapSnapshotTable(base: HeapSnapshotReport, head: HeapSnapshotReport) {
	return renderMetricComparisonTable(
		base.samples,
		head.samples,
		heapSnapshotCategories.map(category => ({
			label: swatch(category),
			getValue: sample => sample.data.categories[category],
			formatValue: formatBytes,
			absoluteThreshold: byteColorThreshold,
			showMedianMad: category === 'total',
			showDeltaPercentage: category === 'total',
			separatorAfter: category === 'total',
		})),
	);
}

const sankeyChildMinRatio = 0.3;
const sankeyParentMinPercent = 10;

function escapeCsvValue(value: string) {
	return `"${String(value).replaceAll('"', '""')}"`;
}

function formatSankeyPercentValue(value: number) {
	const rounded = Math.round(value * 100) / 100;
	if (rounded === 0 && value > 0) return '0.01';
	if (Number.isInteger(rounded)) return String(rounded);
	return rounded.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
}

/**
 * heap snapshotの構成比をmermaidのsankey図として描画する。
 * 全体に占める割合が小さいカテゴリ・内訳は `Other` にまとめる。
 */
export function renderHeapSnapshotSankey(report: HeapSnapshotReport, title: string) {
	const total = categoryValue(report, 'total');
	// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
	if (total == null || total <= 0) return null;

	const categories = heapSnapshotCategories
		.filter(category => category !== 'total')
		.map(category => {
			const value = categoryValue(report, category);
			// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
			if (value == null || value <= 0) return null;

			const breakdownEntries = Object.entries(report.summary.breakdowns?.[category] ?? {})
				.filter(([, childValue]) => Number.isFinite(childValue) && childValue > 0)
				.toSorted((a, b) => b[1] - a[1]);
			const breakdownTotal = breakdownEntries.reduce((sum, [, childValue]) => sum + childValue, 0);
			const percent = (value * 100) / total;
			const childEntries: [string, number][] = [];
			let otherPercent = 0;

			if (breakdownTotal > 0 && percent > sankeyParentMinPercent) {
				for (const [childName, childValue] of breakdownEntries) {
					const childRatio = childValue / breakdownTotal;
					if (childRatio >= sankeyChildMinRatio) {
						childEntries.push([childName.replace(/^[^:]+:\s*/, ''), percent * childRatio]);
					} else {
						otherPercent += percent * childRatio;
					}
				}

				if (childEntries.length > 0 && otherPercent > 0) {
					childEntries.push(['Other', otherPercent]);
				}
			}

			return { category, percent, childEntries };
		})
		.filter(value => value != null);

	if (categories.length === 0) return null;

	const nodeColors: Record<string, string> = {
		[title]: heapSnapshotCategory.total.colorHex,
		Other: '#888888',
	};
	for (const { category, childEntries } of categories) {
		nodeColors[category] = heapSnapshotCategory[category].colorHex;
		for (const [childName] of childEntries) {
			nodeColors[childName] = heapSnapshotCategory[category].colorHex;
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
				nodeColors,
			},
		})}}%%`,
		'sankey-beta',
	];

	for (const { category, percent, childEntries } of categories) {
		const categoryLabel = heapSnapshotCategory[category].label;
		lines.push(`${escapeCsvValue(title)},${escapeCsvValue(categoryLabel)},${formatSankeyPercentValue(percent)}`);

		for (const [childName, childPercent] of childEntries) {
			lines.push(`${escapeCsvValue(categoryLabel)},${escapeCsvValue(childName)},${formatSankeyPercentValue(childPercent)}`);
		}
	}

	lines.push('```', '', '</details>');

	return lines.join('\n');
}
