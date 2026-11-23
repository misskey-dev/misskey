/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { finiteMedian } from '../stats';
import { collapseHeapSnapshotBreakdown } from './breakdown';
import {
	heapSnapshotBreakdownCategories,
	heapSnapshotCategories,
	type HeapSnapshotCategory,
	type HeapSnapshotData,
} from './categories';

function isComplete(values: Partial<Record<HeapSnapshotCategory, number>>): values is Record<HeapSnapshotCategory, number> {
	return heapSnapshotCategories.every(category => values[category] != null);
}

/**
 * 複数ラウンド分のheap snapshotを、カテゴリ・内訳ごとの中央値にまとめる。
 * 全カテゴリ分の値が揃わなければ null を返す。
 */
export function summarizeHeapSnapshotDataSamples<T>(
	samples: T[],
	getData: (sample: T) => HeapSnapshotData | null | undefined,
	options: { breakdownTopN?: number } = {},
) {
	const data = samples.map(getData);

	const categories: Partial<HeapSnapshotData['categories']> = {};
	const nodeCounts: Partial<HeapSnapshotData['nodeCounts']> = {};
	for (const category of heapSnapshotCategories) {
		const categoryValue = finiteMedian(data.map(snapshot => snapshot?.categories?.[category]));
		if (categoryValue != null) categories[category] = categoryValue;

		const nodeCountValue = finiteMedian(data.map(snapshot => snapshot?.nodeCounts?.[category]));
		if (nodeCountValue != null) nodeCounts[category] = nodeCountValue;
	}

	// 一部のカテゴリだけ欠けた状態で返すと、呼び出し側が完全な値として扱って
	// undefined を描画してしまう。全カテゴリ揃っていなければサマリ自体を無しとする
	if (!isComplete(categories) || !isComplete(nodeCounts)) return null;

	const breakdowns: NonNullable<HeapSnapshotData['breakdowns']> = {};
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
