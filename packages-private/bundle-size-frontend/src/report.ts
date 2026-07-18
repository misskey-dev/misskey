/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { renderFrontendChunkReport } from './chunk-report';
import { collectVisualizerReport, renderVisualizerSummaryTable, type VisualizerReport } from './visualizer';
import type { CollectedReport } from './manifest';

export type RenderBundleReportOptions = {
	/** rollup-plugin-visualizer が出力したtreemap HTMLのartifact URL */
	visualizerArtifactUrl: string;
};

export function renderBundleReportMarkdown(
	before: CollectedReport,
	after: CollectedReport,
	beforeStats: VisualizerReport,
	afterStats: VisualizerReport,
	options: RenderBundleReportOptions,
) {
	return [
		'## 📦 Frontend Bundle Report',
		'',
		renderFrontendChunkReport(before, after),
		'',
		'## Bundle Stats',
		'',
		renderVisualizerSummaryTable(collectVisualizerReport(beforeStats), collectVisualizerReport(afterStats)),
		'',
		`[Open treemap HTML](${options.visualizerArtifactUrl})`,
	].join('\n');
}
