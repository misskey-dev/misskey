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

export const defaultHeapSnapshotBreakdownTopN = 6;

export function createEmptyHeapSnapshotData(): HeapSnapshotData {
	const categories = {} as HeapSnapshotData['categories'];
	const nodeCounts = {} as HeapSnapshotData['nodeCounts'];
	for (const category of Object.keys(heapSnapshotCategory) as (keyof typeof heapSnapshotCategory)[]) {
		categories[category] = 0;
		nodeCounts[category] = 0;
	}
	return {
		categories,
		nodeCounts,
		breakdowns: {} as HeapSnapshotData['breakdowns'],
	};
}

function sanitizeHeapSnapshotBreakdownLabel(value: unknown, fallback = 'unknown') {
	const label = String(value ?? '').replace(/\s+/g, ' ').trim();
	if (label === '') return fallback;
	if (label.length <= 80) return label;
	return `${label.slice(0, 77)}...`;
}

function classifyHeapSnapshotBreakdown(category: keyof typeof heapSnapshotCategory, type: string, name: string) {
	if (category === 'strings') return type;

	if (category === 'jsArrays') {
		if (type === 'array elements') return 'Array elements';
		if (type === 'object' && name === 'Array') return 'Array objects';
		return sanitizeHeapSnapshotBreakdownLabel(`${type}: ${name}`);
	}

	if (category === 'typedArrays') {
		if (name === 'system / JSArrayBufferData') return 'ArrayBuffer data';
		return sanitizeHeapSnapshotBreakdownLabel(`${type}: ${name}`);
	}

	if (category === 'systemObjects') {
		if (name.startsWith('system /')) return sanitizeHeapSnapshotBreakdownLabel(name);
		if (name.startsWith('(system ')) return sanitizeHeapSnapshotBreakdownLabel(name);
		return sanitizeHeapSnapshotBreakdownLabel(`${type}: ${name}`, type);
	}

	if (category === 'otherJsObjects') {
		if (type === 'object') return sanitizeHeapSnapshotBreakdownLabel(`object: ${name}`, 'object: unknown');
		return type;
	}

	if (category === 'otherNonJsObjects') {
		if (type === 'extra native bytes') return 'Extra native bytes';
		if (type === 'native') return sanitizeHeapSnapshotBreakdownLabel(`native: ${name}`, 'native: unknown');
		return sanitizeHeapSnapshotBreakdownLabel(`${type}: ${name}`, type);
	}

	if (category === 'code') {
		const lowerName = name.toLowerCase();
		if (lowerName.includes('bytecode')) return 'bytecode';
		if (lowerName.includes('builtin')) return 'builtins';
		if (lowerName.includes('regexp')) return 'regexp code';
		if (lowerName.includes('stub')) return 'stubs';
		return sanitizeHeapSnapshotBreakdownLabel(`code: ${name}`, 'code: unknown');
	}

	return sanitizeHeapSnapshotBreakdownLabel(`${type}: ${name}`, type);
}

export function collapseHeapSnapshotBreakdown(breakdown: Record<string, number>, topN = defaultHeapSnapshotBreakdownTopN) {
	const entries = Object.entries(breakdown)
		.filter(([, value]) => value > 0)
		.toSorted((a, b) => b[1] - a[1]);

	const topEntries = entries.slice(0, topN);
	const otherValue = entries
		.slice(topN)
		.reduce((sum, [, value]) => sum + value, 0);

	const collapsed = Object.fromEntries(topEntries);
	if (otherValue > 0) collapsed.Other = otherValue;
	return collapsed;
}

export function collapseHeapSnapshotBreakdowns(
	breakdowns: Partial<Record<keyof typeof heapSnapshotCategory, Record<string, number>>>,
	topN = defaultHeapSnapshotBreakdownTopN,
) {
	const collapsed = {} as NonNullable<HeapSnapshotData['breakdowns']>;
	for (const category of Object.keys(heapSnapshotCategory) as (keyof typeof heapSnapshotCategory)[]) {
		if (category === 'total') continue;

		const categoryBreakdown = breakdowns[category];
		if (categoryBreakdown == null) continue;

		const collapsedCategory = collapseHeapSnapshotBreakdown(categoryBreakdown, topN);
		if (Object.keys(collapsedCategory).length > 0) {
			collapsed[category] = collapsedCategory;
		}
	}

	return collapsed;
}

// Keep these buckets aligned with Chrome DevTools' heap snapshot Statistics view.
export function analyzeHeapSnapshot(snapshot: any, options: { breakdownTopN?: number } = {}): HeapSnapshotData {
	const meta = snapshot?.snapshot?.meta;
	const nodes = snapshot?.nodes;
	const edges = snapshot?.edges;
	const strings = snapshot?.strings;
	if (meta == null || !Array.isArray(nodes) || !Array.isArray(edges) || !Array.isArray(strings)) {
		throw new Error('Invalid heap snapshot format');
	}

	const nodeFields = meta.node_fields;
	if (!Array.isArray(nodeFields)) throw new Error('Invalid heap snapshot node fields');
	const edgeFields = meta.edge_fields;
	if (!Array.isArray(edgeFields)) throw new Error('Invalid heap snapshot edge fields');

	const typeOffset = nodeFields.indexOf('type');
	const nameOffset = nodeFields.indexOf('name');
	const selfSizeOffset = nodeFields.indexOf('self_size');
	const edgeCountOffset = nodeFields.indexOf('edge_count');
	if (typeOffset < 0 || nameOffset < 0 || selfSizeOffset < 0 || edgeCountOffset < 0) {
		throw new Error('Heap snapshot is missing required node fields');
	}
	const edgeTypeOffset = edgeFields.indexOf('type');
	const edgeNameOffset = edgeFields.indexOf('name_or_index');
	const edgeToNodeOffset = edgeFields.indexOf('to_node');
	if (edgeTypeOffset < 0 || edgeNameOffset < 0 || edgeToNodeOffset < 0) {
		throw new Error('Heap snapshot is missing required edge fields');
	}

	const nodeTypeNames = meta.node_types?.[typeOffset];
	if (!Array.isArray(nodeTypeNames)) throw new Error('Invalid heap snapshot node types');
	const edgeTypeNames = meta.edge_types?.[edgeTypeOffset];
	if (!Array.isArray(edgeTypeNames)) throw new Error('Invalid heap snapshot edge types');

	const nodeFieldCount = nodeFields.length;
	const edgeFieldCount = edgeFields.length;
	const nativeType = nodeTypeNames.indexOf('native');
	const codeType = nodeTypeNames.indexOf('code');
	const hiddenType = nodeTypeNames.indexOf('hidden');
	const stringTypes = new Set([
		nodeTypeNames.indexOf('string'),
		nodeTypeNames.indexOf('concatenated string'),
		nodeTypeNames.indexOf('sliced string'),
	]);
	const internalEdgeType = edgeTypeNames.indexOf('internal');
	const extraNativeBytes = Number.isFinite(snapshot.snapshot.extra_native_bytes) ? snapshot.snapshot.extra_native_bytes : 0;
	const { categories, nodeCounts } = createEmptyHeapSnapshotData();
	const breakdowns = {} as Record<keyof typeof heapSnapshotCategory, Record<string, number>>;
	for (const category of Object.keys(heapSnapshotCategory) as (keyof typeof heapSnapshotCategory)[]) {
		if (category !== 'total') breakdowns[category] = {};
	}

	function addValue(map: Record<string, number>, key: string, value: number) {
		map[key] = (map[key] ?? 0) + value;
	}

	const edgeStartIndexes = new Map<number, number>();
	const retainerCounts = new Map<number, number>();
	let edgeIndex = 0;
	for (let nodeIndex = 0; nodeIndex < nodes.length; nodeIndex += nodeFieldCount) {
		edgeStartIndexes.set(nodeIndex, edgeIndex);
		const edgeCount = nodes[nodeIndex + edgeCountOffset] ?? 0;
		for (let i = 0; i < edgeCount; i++, edgeIndex += edgeFieldCount) {
			const toNodeIndex = edges[edgeIndex + edgeToNodeOffset];
			retainerCounts.set(toNodeIndex, (retainerCounts.get(toNodeIndex) ?? 0) + 1);
		}
	}

	const jsArrayElementNodeIndexes = new Set<number>();

	function addCategoryValue(category: keyof typeof heapSnapshotCategory, value: number, type: string, name: string, nodeIndex: number | null = null) {
		if (value <= 0) return;
		categories[category] += value;
		addValue(breakdowns[category], classifyHeapSnapshotBreakdown(category, type, name), value);
		if (nodeIndex != null) nodeCounts[category]++;
	}

	function addJsArrayElementSize(nodeIndex: number) {
		const beginEdgeIndex = edgeStartIndexes.get(nodeIndex) ?? 0;
		const edgeCount = nodes[nodeIndex + edgeCountOffset] ?? 0;
		for (let i = 0, currentEdgeIndex = beginEdgeIndex; i < edgeCount; i++, currentEdgeIndex += edgeFieldCount) {
			const edgeType = edges[currentEdgeIndex + edgeTypeOffset];
			if (edgeType !== internalEdgeType) continue;

			const edgeName = strings[edges[currentEdgeIndex + edgeNameOffset]];
			if (edgeName !== 'elements') continue;

			const elementsNodeIndex = edges[currentEdgeIndex + edgeToNodeOffset];
			if ((retainerCounts.get(elementsNodeIndex) ?? 0) === 1) {
				const elementsSize = nodes[elementsNodeIndex + selfSizeOffset] ?? 0;
				addCategoryValue('jsArrays', elementsSize, 'array elements', 'Array elements', elementsNodeIndex);
				jsArrayElementNodeIndexes.add(elementsNodeIndex);
			}
			break;
		}
	}

	if (extraNativeBytes > 0) {
		addCategoryValue('otherNonJsObjects', extraNativeBytes, 'extra native bytes', 'extra native bytes');
	}

	for (let nodeIndex = 0; nodeIndex < nodes.length; nodeIndex += nodeFieldCount) {
		const typeId = nodes[nodeIndex + typeOffset];
		const type = nodeTypeNames[typeId] ?? 'unknown';
		const name = strings[nodes[nodeIndex + nameOffset]] ?? '';
		const selfSize = nodes[nodeIndex + selfSizeOffset] ?? 0;
		categories.total += selfSize;
		nodeCounts.total++;

		if (typeId === hiddenType) {
			addCategoryValue('systemObjects', selfSize, type, name, nodeIndex);
			continue;
		}

		if (typeId === nativeType) {
			if (name === 'system / JSArrayBufferData') {
				addCategoryValue('typedArrays', selfSize, type, name, nodeIndex);
			} else {
				addCategoryValue('otherNonJsObjects', selfSize, type, name, nodeIndex);
			}
			continue;
		}

		if (typeId === codeType) {
			addCategoryValue('code', selfSize, type, name, nodeIndex);
			continue;
		}

		if (stringTypes.has(typeId)) {
			addCategoryValue('strings', selfSize, type, name, nodeIndex);
			continue;
		}

		if (name === 'Array') {
			addCategoryValue('jsArrays', selfSize, type, name, nodeIndex);
			addJsArrayElementSize(nodeIndex);
			continue;
		}
	}

	categories.total += extraNativeBytes;

	for (let nodeIndex = 0; nodeIndex < nodes.length; nodeIndex += nodeFieldCount) {
		if (jsArrayElementNodeIndexes.has(nodeIndex)) continue;

		const typeId = nodes[nodeIndex + typeOffset];
		if (typeId === hiddenType || typeId === nativeType || typeId === codeType || stringTypes.has(typeId)) continue;

		const name = strings[nodes[nodeIndex + nameOffset]] ?? '';
		if (name === 'Array') continue;

		const type = nodeTypeNames[typeId] ?? 'unknown';
		const selfSize = nodes[nodeIndex + selfSizeOffset] ?? 0;
		addCategoryValue('otherJsObjects', selfSize, type, name, nodeIndex);
	}

	return {
		categories,
		nodeCounts,
		breakdowns: collapseHeapSnapshotBreakdowns(breakdowns, options.breakdownTopN),
	};
}

function finiteMedian(values: (number | null | undefined)[]) {
	const finiteValues = values.filter(value => Number.isFinite(value)) as number[];
	if (finiteValues.length === 0) return null;
	return util.median(finiteValues);
}

export function summarizeHeapSnapshotDataSamples<T>(
	samples: T[],
	getData: (sample: T) => HeapSnapshotData | null | undefined,
	options: { breakdownTopN?: number } = {},
) {
	const data = samples.map(getData);
	const categories = {} as HeapSnapshotData['categories'];
	for (const category of Object.keys(heapSnapshotCategory) as (keyof typeof heapSnapshotCategory)[]) {
		const value = finiteMedian(data.map(snapshot => snapshot?.categories?.[category]));
		if (value != null) categories[category] = value;
	}

	const nodeCounts = {} as HeapSnapshotData['nodeCounts'];
	for (const category of Object.keys(heapSnapshotCategory) as (keyof typeof heapSnapshotCategory)[]) {
		const value = finiteMedian(data.map(snapshot => snapshot?.nodeCounts?.[category]));
		if (value != null) nodeCounts[category] = value;
	}

	if (Object.keys(categories).length === 0) return null;

	const breakdowns = {} as NonNullable<HeapSnapshotData['breakdowns']>;
	for (const category of Object.keys(heapSnapshotCategory) as (keyof typeof heapSnapshotCategory)[]) {
		if (category === 'total') continue;

		const childKeys = new Set<string>();
		for (const snapshot of data) {
			for (const childKey of Object.keys(snapshot?.breakdowns?.[category] ?? {})) {
				childKeys.add(childKey);
			}
		}

		const categoryBreakdown = {} as Record<string, number>;
		for (const childKey of childKeys) {
			const value = finiteMedian(data.map(snapshot => snapshot?.breakdowns?.[category]?.[childKey]));
			if (value != null) categoryBreakdown[childKey] = value;
		}

		const collapsed = collapseHeapSnapshotBreakdown(categoryBreakdown, options.breakdownTopN);
		if (Object.keys(collapsed).length > 0) {
			breakdowns[category] = collapsed;
		}
	}

	return {
		categories,
		nodeCounts,
		...(Object.keys(breakdowns).length > 0 ? { breakdowns } : {}),
	};
}

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
			const deltaMedian = `${util.formatDeltaBytes(summary.median, 100000)}<br>${util.formatDeltaPercent(percent, 0.1).replaceAll('\\%', '\\\\%')}`;
			const baseText = `${util.formatBytes(baseValue)} <br> ± ${util.formatBytes(baseSpread)}`;
			const headText = `${util.formatBytes(headValue)} <br> ± ${util.formatBytes(headSpread)}`;
			const metricText = `$\\color{${heapSnapshotCategory[category].color}}{\\rule{8pt}{8pt}}$ **${heapSnapshotCategory[category].label}**`;
			lines.push(`| ${metricText} | ${baseText} | ${headText} | ${deltaMedian} | ${util.formatBytes(summary.mad)} | ${util.formatDeltaBytes(summary.min, 100000)} | ${util.formatDeltaBytes(summary.max, 100000)} |`);
			lines.push('| | | | | | | |');
		} else {
			const deltaMedian = util.formatDeltaBytes(summary.median, 100000);
			const baseText = util.formatBytes(baseValue);
			const headText = util.formatBytes(headValue);
			const basePercent = util.formatPercent((baseValue * 100) / baseTotal);
			const headPercent = util.formatPercent((headValue * 100) / headTotal);
			const metricText = `<details><summary>$\\color{${heapSnapshotCategory[category].color}}{\\rule{8pt}{8pt}}$ **${heapSnapshotCategory[category].label}**</summary>${basePercent} → ${headPercent}</details>`;
			lines.push(`| ${metricText} | ${baseText} | ${headText} | ${deltaMedian} | ${util.formatBytes(summary.mad)} | ${util.formatDeltaBytes(summary.min, 100000)} | ${util.formatDeltaBytes(summary.max, 100000)} |`);
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
