/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import {
	defaultHeapSnapshotBreakdownTopN,
	heapSnapshotBreakdownCategories,
	type HeapSnapshotCategory,
	type HeapSnapshotData,
} from './categories';

function sanitizeLabel(value: unknown, fallback = 'unknown') {
	const label = String(value ?? '').replace(/\s+/g, ' ').trim();
	if (label === '') return fallback;
	if (label.length <= 80) return label;
	return `${label.slice(0, 77)}...`;
}

/**
 * ノードの type / name から、内訳テーブルに出す粒度のラベルを決める。
 */
export function classifyHeapSnapshotBreakdown(category: HeapSnapshotCategory, type: string, name: string) {
	switch (category) {
		case 'strings':
			return type;

		case 'jsArrays':
			if (type === 'array elements') return 'Array elements';
			if (type === 'object' && name === 'Array') return 'Array objects';
			return sanitizeLabel(`${type}: ${name}`);

		case 'typedArrays':
			if (name === 'system / JSArrayBufferData') return 'ArrayBuffer data';
			return sanitizeLabel(`${type}: ${name}`);

		case 'systemObjects':
			if (name.startsWith('system /') || name.startsWith('(system ')) return sanitizeLabel(name);
			return sanitizeLabel(`${type}: ${name}`, type);

		case 'otherJsObjects':
			if (type === 'object') return sanitizeLabel(`object: ${name}`, 'object: unknown');
			return type;

		case 'otherNonJsObjects':
			if (type === 'extra native bytes') return 'Extra native bytes';
			if (type === 'native') return sanitizeLabel(`native: ${name}`, 'native: unknown');
			return sanitizeLabel(`${type}: ${name}`, type);

		case 'code': {
			const lowerName = name.toLowerCase();
			if (lowerName.includes('bytecode')) return 'bytecode';
			if (lowerName.includes('builtin')) return 'builtins';
			if (lowerName.includes('regexp')) return 'regexp code';
			if (lowerName.includes('stub')) return 'stubs';
			return sanitizeLabel(`code: ${name}`, 'code: unknown');
		}

		default:
			return sanitizeLabel(`${type}: ${name}`, type);
	}
}

/**
 * 内訳を上位N件に丸め、残りを `Other` にまとめる。
 */
export function collapseHeapSnapshotBreakdown(breakdown: Record<string, number>, topN = defaultHeapSnapshotBreakdownTopN) {
	const entries = Object.entries(breakdown)
		.filter(([, value]) => value > 0)
		.toSorted((a, b) => b[1] - a[1]);

	const collapsed = Object.fromEntries(entries.slice(0, topN));
	const otherValue = entries.slice(topN).reduce((sum, [, value]) => sum + value, 0);
	if (otherValue > 0) collapsed.Other = otherValue;
	return collapsed;
}

export function collapseHeapSnapshotBreakdowns(
	breakdowns: Partial<Record<HeapSnapshotCategory, Record<string, number>>>,
	topN = defaultHeapSnapshotBreakdownTopN,
) {
	const collapsed: NonNullable<HeapSnapshotData['breakdowns']> = {};
	for (const category of heapSnapshotBreakdownCategories) {
		const categoryBreakdown = breakdowns[category];
		if (categoryBreakdown == null) continue;

		const collapsedCategory = collapseHeapSnapshotBreakdown(categoryBreakdown, topN);
		if (Object.keys(collapsedCategory).length > 0) {
			collapsed[category] = collapsedCategory;
		}
	}

	return collapsed;
}
