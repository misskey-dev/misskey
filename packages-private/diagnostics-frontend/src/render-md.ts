/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { readOptionalEnv, readRequiredEnv } from 'diagnostics-shared/env';
import { collectBundleReport } from './bundle/manifest';
import { renderFrontendDiagnosticsMarkdown } from './report';
import type { BrowserMetricsReport } from './browser/types';
import type { VisualizerReport } from './bundle/visualizer';

const args = process.argv.slice(2);
if (args.length !== 7) {
	throw new Error('Usage: render-md <baseDir> <headDir> <baseBundleStatsJson> <headBundleStatsJson> <baseBrowserJson> <headBrowserJson> <outMd>');
}
const [
	baseDirArg,
	headDirArg,
	baseBundleStatsFileArg,
	headBundleStatsFileArg,
	baseBrowserFileArg,
	headBrowserFileArg,
	outputFileArg,
] = args as [string, string, string, string, string, string, string];

const [
	baseBundle,
	headBundle,
	baseBundleStatsJson,
	headBundleStatsJson,
	baseBrowserJson,
	headBrowserJson,
] = await Promise.all([
	collectBundleReport(resolve(baseDirArg)),
	collectBundleReport(resolve(headDirArg)),
	readFile(resolve(baseBundleStatsFileArg), 'utf8'),
	readFile(resolve(headBundleStatsFileArg), 'utf8'),
	readFile(resolve(baseBrowserFileArg), 'utf8'),
	readFile(resolve(headBrowserFileArg), 'utf8'),
]);

await writeFile(
	resolve(outputFileArg),
	renderFrontendDiagnosticsMarkdown({
		bundle: {
			base: baseBundle,
			head: headBundle,
			baseStats: JSON.parse(baseBundleStatsJson) as VisualizerReport,
			headStats: JSON.parse(headBundleStatsJson) as VisualizerReport,
			visualizerArtifactUrl: readRequiredEnv('FRONTEND_BUNDLE_REPORT_ARTIFACT_URL'),
		},
		browser: {
			base: JSON.parse(baseBrowserJson) as BrowserMetricsReport,
			head: JSON.parse(headBrowserJson) as BrowserMetricsReport,
			baseHeapSnapshotUrl: readRequiredEnv('FRONTEND_BROWSER_BASE_HEAP_SNAPSHOT_ARTIFACT_URL'),
			headHeapSnapshotUrl: readRequiredEnv('FRONTEND_BROWSER_HEAD_HEAP_SNAPSHOT_ARTIFACT_URL'),
			detailedHtmlUrl: readOptionalEnv('FRONTEND_BROWSER_DETAILED_HTML_ARTIFACT_URL'),
		},
	}),
);
