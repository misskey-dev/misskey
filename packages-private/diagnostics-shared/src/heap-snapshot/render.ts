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
import { independentDeltaSummary, type IndependentDeltaSummary, type IndependentDeltaVerdict } from '../stats';
import {
	heapSnapshotCategories,
	heapSnapshotCategory,
	type HeapSnapshotCategory,
	type HeapSnapshotReport,
} from './categories';

/** これ未満のバイト差分には色を付けない (0.1 MB) */
const byteColorThreshold = 100_000;
const percentColorThreshold = 0.1;

function categoryValue(report: HeapSnapshotReport, category: HeapSnapshotCategory) {
	return report.summary.categories[category];
}

function swatch(category: HeapSnapshotCategory) {
	return `$\\color{${heapSnapshotCategory[category].color}}{\\rule{8pt}{8pt}}$ **${heapSnapshotCategory[category].label}**`;
}

function isDirectionalVerdict(verdict: IndependentDeltaVerdict) {
	return verdict === 'increase' || verdict === 'decrease';
}

function formatOptionalBytes(value: number | null) {
	return value == null ? '-' : formatBytes(value);
}

function formatMedianWithMad(value: number | null, spread: number | null) {
	if (value == null) return '-';
	return `${formatBytes(value)} <br> ± ${formatOptionalBytes(spread)}`;
}

function formatSnapshotDelta(summary: IndependentDeltaSummary) {
	if (summary.delta == null) return '-';
	return formatDeltaBytes(
		summary.delta,
		isDirectionalVerdict(summary.verdict) ? byteColorThreshold : Number.POSITIVE_INFINITY,
	);
}

function formatSnapshotDeltaPercent(summary: IndependentDeltaSummary) {
	if (summary.baseMedian == null || summary.baseMedian === 0 || summary.delta == null) return '-';
	const percent = summary.delta * 100 / summary.baseMedian;
	return formatDeltaPercentInMdTable(
		percent,
		isDirectionalVerdict(summary.verdict) ? percentColorThreshold : Number.POSITIVE_INFINITY,
	);
}

function formatCategoryPercent(value: number | null, total: number | null) {
	if (value == null || total == null || total === 0) return '-';
	return formatPercent((value * 100) / total);
}

function categoryDeltaSummary(base: HeapSnapshotReport, head: HeapSnapshotReport, category: HeapSnapshotCategory) {
	return independentDeltaSummary(
		base.samples,
		head.samples,
		sample => sample.data.categories[category],
	);
}

/**
 * base / head のheap snapshotをカテゴリ別に比較するMarkdownテーブルを描画する。
 */
export function renderHeapSnapshotTable(base: HeapSnapshotReport, head: HeapSnapshotReport) {
	const lines = [
		'| Metric | Base | Head | Delta | Combined MAD | Result |',
		'| --- | ---: | ---: | ---: | ---: | --- |',
	];
	const totalSummary = categoryDeltaSummary(base, head, 'total');
	const baseTotal = totalSummary.baseMedian;
	const headTotal = totalSummary.headMedian;

	for (const category of heapSnapshotCategories) {
		const summary = category === 'total' ? totalSummary : categoryDeltaSummary(base, head, category);
		const baseValue = summary.baseMedian;
		const headValue = summary.headMedian;
		const combinedMad = formatOptionalBytes(summary.combinedMad);

		if (category === 'total') {
			const delta = `${formatSnapshotDelta(summary)}<br>${formatSnapshotDeltaPercent(summary)}`;
			lines.push(`| ${swatch(category)} | ${formatMedianWithMad(baseValue, summary.baseMad)} | ${formatMedianWithMad(headValue, summary.headMad)} | ${delta} | ${combinedMad} | ${summary.verdict} |`);
			lines.push('| | | | | | |');
		} else {
			const basePercent = formatCategoryPercent(baseValue, baseTotal);
			const headPercent = formatCategoryPercent(headValue, headTotal);
			const metric = `<details><summary>${swatch(category)}</summary>${basePercent} → ${headPercent}</details>`;
			lines.push(`| ${metric} | ${formatOptionalBytes(baseValue)} | ${formatOptionalBytes(headValue)} | ${formatSnapshotDelta(summary)} | ${combinedMad} | ${summary.verdict} |`);
		}
	}

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
