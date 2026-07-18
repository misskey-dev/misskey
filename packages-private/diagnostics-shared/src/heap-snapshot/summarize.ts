/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { finiteMedian } from '../stats';
import { collapseHeapSnapshotBreakdown } from './breakdown';
import {
	heapSnapshotBreakdownCategories,
	heapSnapshotCategories,
	type HeapSnapshotData,
} from './categories';

/**
 * 複数ラウンド分のheap snapshotを、カテゴリ・内訳ごとの中央値にまとめる。
 * 有効なサンプルが1つも無ければ null を返す。
 */
export function summarizeHeapSnapshotDataSamples<T>(
	samples: T[],
	getData: (sample: T) => HeapSnapshotData | null | undefined,
	options: { breakdownTopN?: number } = {},
) {
	const data = samples.map(getData);

	const categories = {} as HeapSnapshotData['categories'];
	const nodeCounts = {} as HeapSnapshotData['nodeCounts'];
	for (const category of heapSnapshotCategories) {
		const categoryValue = finiteMedian(data.map(snapshot => snapshot?.categories?.[category]));
		if (categoryValue != null) categories[category] = categoryValue;

		const nodeCountValue = finiteMedian(data.map(snapshot => snapshot?.nodeCounts?.[category]));
		if (nodeCountValue != null) nodeCounts[category] = nodeCountValue;
	}

	if (Object.keys(categories).length === 0) return null;

	const breakdowns = {} as NonNullable<HeapSnapshotData['breakdowns']>;
	for (const category of heapSnapshotBreakdownCategories) {
		const childKeys = new Set(data.flatMap(snapshot => Object.keys(snapshot?.breakdowns?.[category] ?? {})));

		const categoryBreakdown = {} as Record<string, number>;
		for (const childKey of childKeys) {
			const value = finiteMedian(data.map(snapshot => snapshot?.breakdowns?.[category]?.[childKey]));
			if (value != null) categoryBreakdown[childKey] = value;
		}

		const collapsed = collapseHeapSnapshotBreakdown(categoryBreakdown, options.breakdownTopN);
		if (Object.keys(collapsed).length > 0) breakdowns[category] = collapsed;
	}

	return {
		categories,
		nodeCounts,
		...(Object.keys(breakdowns).length > 0 ? { breakdowns } : {}),
	} satisfies HeapSnapshotData;
}
