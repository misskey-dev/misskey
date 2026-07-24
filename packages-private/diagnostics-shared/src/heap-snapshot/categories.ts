/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// Chrome DevTools の heap snapshot Statistics ビューと同じ分類になるように保つこと。
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

export type HeapSnapshotCategory = keyof typeof heapSnapshotCategory;

export const heapSnapshotCategories = Object.keys(heapSnapshotCategory) as HeapSnapshotCategory[];

/** `total` は他カテゴリの合算ではなく全体量なので、内訳を扱うときは除外する */
export const heapSnapshotBreakdownCategories = heapSnapshotCategories.filter(category => category !== 'total');

export type HeapSnapshotData = {
	categories: Record<HeapSnapshotCategory, number>;
	nodeCounts: Record<HeapSnapshotCategory, number>;
	/** 内訳が空でないカテゴリだけが入る (`total` は内訳を持たない) */
	breakdowns?: Partial<Record<HeapSnapshotCategory, Record<string, number>>>;
};

export type HeapSnapshotReport = {
	summary: HeapSnapshotData;
	samples: {
		round: number;
		data: HeapSnapshotData;
	}[];
};

export const defaultHeapSnapshotBreakdownTopN = 6;

export function createEmptyHeapSnapshotData(): HeapSnapshotData {
	const categories = {} as HeapSnapshotData['categories'];
	const nodeCounts = {} as HeapSnapshotData['nodeCounts'];
	for (const category of heapSnapshotCategories) {
		categories[category] = 0;
		nodeCounts[category] = 0;
	}
	return {
		categories,
		nodeCounts,
		breakdowns: {},
	};
}
