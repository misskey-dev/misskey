/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { classifyHeapSnapshotBreakdown, collapseHeapSnapshotBreakdowns } from './breakdown';
import {
	createEmptyHeapSnapshotData,
	heapSnapshotBreakdownCategories,
	type HeapSnapshotCategory,
	type HeapSnapshotData,
} from './categories';

/**
 * `.heapsnapshot` のJSONを、フィールドオフセットを解決した状態で扱うためのビュー。
 */
type HeapSnapshotView = {
	nodes: number[];
	edges: number[];
	strings: string[];
	nodeFieldCount: number;
	edgeFieldCount: number;
	nodeTypeNames: string[];
	edgeTypeNames: string[];
	typeOffset: number;
	nameOffset: number;
	selfSizeOffset: number;
	edgeCountOffset: number;
	edgeTypeOffset: number;
	edgeNameOffset: number;
	edgeToNodeOffset: number;
	extraNativeBytes: number;
};

function requireOffsets(fields: string[], names: string[], what: string) {
	const offsets = names.map(name => fields.indexOf(name));
	if (offsets.some(offset => offset < 0)) throw new Error(`Heap snapshot is missing required ${what} fields`);
	return offsets;
}

function parseHeapSnapshot(snapshot: any): HeapSnapshotView {
	const meta = snapshot?.snapshot?.meta;
	const { nodes, edges, strings } = snapshot ?? {};
	if (meta == null || !Array.isArray(nodes) || !Array.isArray(edges) || !Array.isArray(strings)) {
		throw new Error('Invalid heap snapshot format');
	}

	const nodeFields = meta.node_fields;
	if (!Array.isArray(nodeFields)) throw new Error('Invalid heap snapshot node fields');
	const edgeFields = meta.edge_fields;
	if (!Array.isArray(edgeFields)) throw new Error('Invalid heap snapshot edge fields');

	const [typeOffset, nameOffset, selfSizeOffset, edgeCountOffset] = requireOffsets(nodeFields, ['type', 'name', 'self_size', 'edge_count'], 'node');
	const [edgeTypeOffset, edgeNameOffset, edgeToNodeOffset] = requireOffsets(edgeFields, ['type', 'name_or_index', 'to_node'], 'edge');

	const nodeTypeNames = meta.node_types?.[typeOffset];
	if (!Array.isArray(nodeTypeNames)) throw new Error('Invalid heap snapshot node types');
	const edgeTypeNames = meta.edge_types?.[edgeTypeOffset];
	if (!Array.isArray(edgeTypeNames)) throw new Error('Invalid heap snapshot edge types');

	return {
		nodes,
		edges,
		strings,
		nodeFieldCount: nodeFields.length,
		edgeFieldCount: edgeFields.length,
		nodeTypeNames,
		edgeTypeNames,
		typeOffset,
		nameOffset,
		selfSizeOffset,
		edgeCountOffset,
		edgeTypeOffset,
		edgeNameOffset,
		edgeToNodeOffset,
		extraNativeBytes: Number.isFinite(snapshot.snapshot.extra_native_bytes) ? snapshot.snapshot.extra_native_bytes : 0,
	};
}

/**
 * ノードごとのedge開始位置と、各ノードが何本のedgeから参照されているかを求める。
 * JS配列のelementsストアが専有されているか判定するために使う。
 */
function indexEdges(view: HeapSnapshotView) {
	const edgeStartIndexes = new Map<number, number>();
	const retainerCounts = new Map<number, number>();
	let edgeIndex = 0;

	for (let nodeIndex = 0; nodeIndex < view.nodes.length; nodeIndex += view.nodeFieldCount) {
		edgeStartIndexes.set(nodeIndex, edgeIndex);
		const edgeCount = view.nodes[nodeIndex + view.edgeCountOffset] ?? 0;
		for (let i = 0; i < edgeCount; i++, edgeIndex += view.edgeFieldCount) {
			const toNodeIndex = view.edges[edgeIndex + view.edgeToNodeOffset];
			retainerCounts.set(toNodeIndex, (retainerCounts.get(toNodeIndex) ?? 0) + 1);
		}
	}

	return { edgeStartIndexes, retainerCounts };
}

export function analyzeHeapSnapshot(snapshot: any, options: { breakdownTopN?: number } = {}): HeapSnapshotData {
	const view = parseHeapSnapshot(snapshot);
	const { nodes, edges, strings, nodeFieldCount, edgeFieldCount, nodeTypeNames, edgeTypeNames } = view;

	const nativeType = nodeTypeNames.indexOf('native');
	const codeType = nodeTypeNames.indexOf('code');
	const hiddenType = nodeTypeNames.indexOf('hidden');
	const stringTypes = new Set([
		nodeTypeNames.indexOf('string'),
		nodeTypeNames.indexOf('concatenated string'),
		nodeTypeNames.indexOf('sliced string'),
	]);
	const internalEdgeType = edgeTypeNames.indexOf('internal');

	const { categories, nodeCounts } = createEmptyHeapSnapshotData();
	const breakdowns = {} as Record<HeapSnapshotCategory, Record<string, number>>;
	for (const category of heapSnapshotBreakdownCategories) {
		breakdowns[category] = {};
	}

	const { edgeStartIndexes, retainerCounts } = indexEdges(view);
	const jsArrayElementNodeIndexes = new Set<number>();

	function addCategoryValue(category: HeapSnapshotCategory, value: number, type: string, name: string, counted = true) {
		if (value <= 0) return;
		categories[category] += value;
		const label = classifyHeapSnapshotBreakdown(category, type, name);
		breakdowns[category][label] = (breakdowns[category][label] ?? 0) + value;
		if (counted) nodeCounts[category]++;
	}

	/**
	 * 配列オブジェクト自身のself_sizeには要素ストアが含まれないため、
	 * その配列だけが参照しているelementsノードの分を JS arrays に加算する。
	 */
	function addJsArrayElementSize(nodeIndex: number) {
		const beginEdgeIndex = edgeStartIndexes.get(nodeIndex) ?? 0;
		const edgeCount = nodes[nodeIndex + view.edgeCountOffset] ?? 0;
		for (let i = 0, currentEdgeIndex = beginEdgeIndex; i < edgeCount; i++, currentEdgeIndex += edgeFieldCount) {
			if (edges[currentEdgeIndex + view.edgeTypeOffset] !== internalEdgeType) continue;
			if (strings[edges[currentEdgeIndex + view.edgeNameOffset]] !== 'elements') continue;

			const elementsNodeIndex = edges[currentEdgeIndex + view.edgeToNodeOffset];
			if ((retainerCounts.get(elementsNodeIndex) ?? 0) === 1) {
				addCategoryValue('jsArrays', nodes[elementsNodeIndex + view.selfSizeOffset] ?? 0, 'array elements', 'Array elements');
				jsArrayElementNodeIndexes.add(elementsNodeIndex);
			}
			break;
		}
	}

	if (view.extraNativeBytes > 0) {
		addCategoryValue('otherNonJsObjects', view.extraNativeBytes, 'extra native bytes', 'extra native bytes', false);
	}

	for (let nodeIndex = 0; nodeIndex < nodes.length; nodeIndex += nodeFieldCount) {
		const typeId = nodes[nodeIndex + view.typeOffset];
		const type = nodeTypeNames[typeId] ?? 'unknown';
		const name = strings[nodes[nodeIndex + view.nameOffset]] ?? '';
		const selfSize = nodes[nodeIndex + view.selfSizeOffset] ?? 0;
		categories.total += selfSize;
		nodeCounts.total++;

		if (typeId === hiddenType) {
			addCategoryValue('systemObjects', selfSize, type, name);
		} else if (typeId === nativeType) {
			addCategoryValue(name === 'system / JSArrayBufferData' ? 'typedArrays' : 'otherNonJsObjects', selfSize, type, name);
		} else if (typeId === codeType) {
			addCategoryValue('code', selfSize, type, name);
		} else if (stringTypes.has(typeId)) {
			addCategoryValue('strings', selfSize, type, name);
		} else if (name === 'Array') {
			addCategoryValue('jsArrays', selfSize, type, name);
			addJsArrayElementSize(nodeIndex);
		}
	}

	categories.total += view.extraNativeBytes;

	// 上のループで JS arrays に計上したelementsノードが確定してから、残りを Other JS objects に振り分ける
	for (let nodeIndex = 0; nodeIndex < nodes.length; nodeIndex += nodeFieldCount) {
		if (jsArrayElementNodeIndexes.has(nodeIndex)) continue;

		const typeId = nodes[nodeIndex + view.typeOffset];
		if (typeId === hiddenType || typeId === nativeType || typeId === codeType || stringTypes.has(typeId)) continue;

		const name = strings[nodes[nodeIndex + view.nameOffset]] ?? '';
		if (name === 'Array') continue;

		addCategoryValue('otherJsObjects', nodes[nodeIndex + view.selfSizeOffset] ?? 0, nodeTypeNames[typeId] ?? 'unknown', name);
	}

	return {
		categories,
		nodeCounts,
		breakdowns: collapseHeapSnapshotBreakdowns(breakdowns, options.breakdownTopN),
	};
}
