/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import {
	formatBytes,
	formatDeltaBytes,
	formatDeltaPercentInMdTable,
	formatPercent,
} from '../format';
import { mad, pairedDeltaSummary } from '../stats';
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

function categorySampleSpread(report: HeapSnapshotReport, category: HeapSnapshotCategory) {
	const values = report.samples
		.map(sample => sample.data.categories[category])
		.filter(value => Number.isFinite(value));
	if (values.length < 2) throw new Error(`Not enough samples for category ${category}`);

	return mad(values);
}

function swatch(category: HeapSnapshotCategory) {
	return `$\\color{${heapSnapshotCategory[category].color}}{\\rule{8pt}{8pt}}$ **${heapSnapshotCategory[category].label}**`;
}

/**
 * base / head のheap snapshotをカテゴリ別に比較するMarkdownテーブルを描画する。
 */
export function renderHeapSnapshotTable(base: HeapSnapshotReport, head: HeapSnapshotReport) {
	const lines = [
		'| Metric | Base | Head | Δ median | Δ MAD | Δ min | Δ max |',
		'| --- | ---: | ---: | ---: | ---: | ---: | ---: |',
	];
	const baseTotal = categoryValue(base, 'total');
	const headTotal = categoryValue(head, 'total');

	for (const category of heapSnapshotCategories) {
		const baseValue = categoryValue(base, category);
		const headValue = categoryValue(head, category);
		const summary = pairedDeltaSummary(base.samples, head.samples, sample => sample.data.categories[category]);
		const deltaColumns = `${formatBytes(summary.mad)} | ${formatDeltaBytes(summary.min, byteColorThreshold)} | ${formatDeltaBytes(summary.max, byteColorThreshold)}`;

		if (category === 'total') {
			// Totalだけはばらつきと変化率も併記する
			const percent = summary.median * 100 / baseValue;
			const deltaMedian = `${formatDeltaBytes(summary.median, byteColorThreshold)}<br>${formatDeltaPercentInMdTable(percent, 0.1)}`;
			const baseText = `${formatBytes(baseValue)} <br> ± ${formatBytes(categorySampleSpread(base, category))}`;
			const headText = `${formatBytes(headValue)} <br> ± ${formatBytes(categorySampleSpread(head, category))}`;
			lines.push(`| ${swatch(category)} | ${baseText} | ${headText} | ${deltaMedian} | ${deltaColumns} |`);
			lines.push('| | | | | | | |');
		} else {
			// 各カテゴリはTotalに占める割合の推移をdetailsで見せる
			const basePercent = formatPercent((baseValue * 100) / baseTotal);
			const headPercent = formatPercent((headValue * 100) / headTotal);
			const metricText = `<details><summary>${swatch(category)}</summary>${basePercent} → ${headPercent}</details>`;
			lines.push(`| ${metricText} | ${formatBytes(baseValue)} | ${formatBytes(headValue)} | ${formatDeltaBytes(summary.median, byteColorThreshold)} | ${deltaColumns} |`);
		}
	}

	if (lines.length === 2) return null;
	return lines.join('\n');
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
