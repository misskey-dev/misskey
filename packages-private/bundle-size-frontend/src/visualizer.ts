/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import {
	calcAndFormatDeltaBytes,
	calcAndFormatDeltaNumber,
	calcAndFormatDeltaPercent,
	formatBytes,
	formatNumber,
} from 'diagnostics-shared/format';

/**
 * rollup-plugin-visualizer が出力する `stats.json` のうち、ここで使う部分のみの型。
 */
export type VisualizerReport = {
	nodeParts?: Record<string, {
		renderedLength: number;
		gzipLength: number;
		brotliLength: number;
	}>;
	nodeMetas?: Record<string, {
		id: string;
		isEntry?: boolean;
		isExternal?: boolean;
		importedBy?: string[];
		imported?: { id: string; dynamic?: boolean }[];
		moduleParts?: Record<string, string>;
		renderedLength: number;
		gzipLength: number;
		brotliLength: number;
	}>;
	options?: Record<string, unknown>;
};

type ModuleRow = {
	id: string;
	bundles: number;
	renderedLength: number;
	gzipLength: number;
	brotliLength: number;
	importedByCount: number;
	importedCount: number;
};

type BundleRow = {
	id: string;
	modules: number;
	renderedLength: number;
	gzipLength: number;
	brotliLength: number;
};

export function collectVisualizerReport(data: VisualizerReport) {
	const nodeParts = data.nodeParts ?? {};
	const nodeMetas = Object.values(data.nodeMetas ?? {});
	const moduleRows: ModuleRow[] = [];
	const bundleMap = new Map<string, BundleRow>();

	for (const meta of nodeMetas) {
		const row: ModuleRow = {
			id: meta.id,
			bundles: 0,
			renderedLength: 0,
			gzipLength: 0,
			brotliLength: 0,
			importedByCount: meta.importedBy?.length ?? 0,
			importedCount: meta.imported?.length ?? 0,
		};

		for (const [bundleId, partUid] of Object.entries(meta.moduleParts ?? {})) {
			const part = nodeParts[partUid];
			// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
			if (part == null) continue;

			row.bundles += 1;
			row.renderedLength += part.renderedLength;
			row.gzipLength += part.gzipLength;
			row.brotliLength += part.brotliLength;

			const bundle = bundleMap.get(bundleId) ?? {
				id: bundleId,
				modules: 0,
				renderedLength: 0,
				gzipLength: 0,
				brotliLength: 0,
			};
			bundle.modules += 1;
			bundle.renderedLength += part.renderedLength;
			bundle.gzipLength += part.gzipLength;
			bundle.brotliLength += part.brotliLength;
			bundleMap.set(bundleId, bundle);
		}

		// どのバンドルにも含まれないモジュール (tree-shake 済み等) は集計対象外
		if (row.bundles > 0) {
			moduleRows.push(row);
		}
	}

	let staticImports = 0;
	let dynamicImports = 0;
	for (const meta of nodeMetas) {
		for (const imported of meta.imported ?? []) {
			if (imported.dynamic) {
				dynamicImports += 1;
			} else {
				staticImports += 1;
			}
		}
	}

	const bundleRows = [...bundleMap.values()].sort((a, b) => b.renderedLength - a.renderedLength);
	const hotModules = [...moduleRows].sort((a, b) => b.renderedLength - a.renderedLength);
	const totalRendered = moduleRows.reduce((sum, row) => sum + row.renderedLength, 0);
	const totalGzip = moduleRows.reduce((sum, row) => sum + row.gzipLength, 0);
	const totalBrotli = moduleRows.reduce((sum, row) => sum + row.brotliLength, 0);

	return {
		options: data.options ?? {},
		summary: {
			bundles: bundleRows.length,
			modules: moduleRows.length,
			entries: nodeMetas.filter((meta) => meta.isEntry).length,
			externals: nodeMetas.filter((meta) => meta.isExternal).length,
			staticImports,
			dynamicImports,
		},
		metrics: {
			renderedLength: totalRendered,
			gzipLength: totalGzip,
			brotliLength: totalBrotli,
		},
		hotModules,
	};
}

/**
 * NOTE: 以前はこの関数が `string[]` を返しており、呼び出し側の `[...].join('\n')` の
 * 要素として配列のまま埋め込まれていたため、テーブルがカンマ区切りの1行に潰れていた。
 * 呼び出し側で意識しなくて済むよう、ここで文字列にして返す。
 */
export function renderVisualizerSummaryTable(before: ReturnType<typeof collectVisualizerReport>, after: ReturnType<typeof collectVisualizerReport>) {
	const summary = [
		'bundles',
		'modules',
		'entries',
		//'externals',
		'staticImports',
		'dynamicImports',
	] as const;

	const metrics = [
		'renderedLength',
		'gzipLength',
		'brotliLength',
	] as const;

	return [
		'<table>',
		'<thead>',
		'<tr>',
		'<th rowspan="2"></th>',
		'<th rowspan="2">Bundles</th>',
		'<th rowspan="2">Modules</th>',
		'<th rowspan="2">Entries</th>',
		'<th colspan="2">Imports</th>',
		'<th colspan="3">Size</th>',
		'</tr>',
		'<tr>',
		'<th>Static</th>',
		'<th>Dynamic</th>',
		'<th>Rendered</th>',
		'<th>Gzip</th>',
		'<th>Brotli</th>',
		'</tr>',
		'</thead>',
		'<tbody>',
		'<tr>',
		'<th><b>Before</b></th>',
		...summary.map((key) => `<td>${formatNumber(before.summary[key])}</td>`),
		...metrics.map((key) => `<td>${formatBytes(before.metrics[key])}</td>`),
		'</tr>',
		'<tr>',
		'<th><b>After</b></th>',
		...summary.map((key) => `<td>${formatNumber(after.summary[key])}</td>`),
		...metrics.map((key) => `<td>${formatBytes(after.metrics[key])}</td>`),
		'</tr>',
		'<tr><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>',
		'<tr>',
		'<th><b>Δ</b></th>',
		...summary.map((key) => `<td>${calcAndFormatDeltaNumber(before.summary[key], after.summary[key], 0)}</td>`),
		...metrics.map((key) => `<td>${calcAndFormatDeltaBytes(before.metrics[key], after.metrics[key], 1000)}</td>`),
		'</tr>',
		'<tr>',
		'<th><b>Δ (%)</b></th>',
		...summary.map((key) => `<td>${calcAndFormatDeltaPercent(before.summary[key], after.summary[key], 0.1)}</td>`),
		...metrics.map((key) => `<td>${calcAndFormatDeltaPercent(before.metrics[key], after.metrics[key], 0.1)}</td>`),
		'</tr>',
		'</tbody>',
		'</table>',
	].join('\n');
}
