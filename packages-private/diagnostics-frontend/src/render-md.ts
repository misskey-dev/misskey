/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { readOptionalEnv, readRequiredEnv } from 'diagnostics-shared/env';
import { renderBrowserDiagnosticsMarkdown } from './browser/report/markdown';
import { collectBundleReport } from './bundle/manifest';
import { renderBundleReportMarkdown } from './bundle/report';
import { renderFrontendDiagnosticsMarkdown } from './report';
import type { BrowserMetricsReport } from './browser/types';
import type { VisualizerReport } from './bundle/visualizer';

const args = process.argv.slice(2);
if (args.length !== 7) {
	throw new Error('Usage: render-md <beforeDir> <afterDir> <beforeBundleStatsJson> <afterBundleStatsJson> <beforeBrowserJson> <afterBrowserJson> <outMd>');
}
const [
	beforeDirArg,
	afterDirArg,
	beforeBundleStatsFileArg,
	afterBundleStatsFileArg,
	beforeBrowserFileArg,
	afterBrowserFileArg,
	outputFileArg,
] = args as [string, string, string, string, string, string, string];

const [
	beforeBundle,
	afterBundle,
	beforeBundleStatsJson,
	afterBundleStatsJson,
	beforeBrowserJson,
	afterBrowserJson,
] = await Promise.all([
	collectBundleReport(resolve(beforeDirArg)),
	collectBundleReport(resolve(afterDirArg)),
	readFile(resolve(beforeBundleStatsFileArg), 'utf8'),
	readFile(resolve(afterBundleStatsFileArg), 'utf8'),
	readFile(resolve(beforeBrowserFileArg), 'utf8'),
	readFile(resolve(afterBrowserFileArg), 'utf8'),
]);

const bundleMarkdown = renderBundleReportMarkdown(
	beforeBundle,
	afterBundle,
	JSON.parse(beforeBundleStatsJson) as VisualizerReport,
	JSON.parse(afterBundleStatsJson) as VisualizerReport,
	{
		visualizerArtifactUrl: readRequiredEnv('FRONTEND_BUNDLE_REPORT_ARTIFACT_URL'),
	},
);

const browserMarkdown = renderBrowserDiagnosticsMarkdown(
	JSON.parse(beforeBrowserJson) as BrowserMetricsReport,
	JSON.parse(afterBrowserJson) as BrowserMetricsReport,
	{
		baseHeapSnapshotUrl: readRequiredEnv('FRONTEND_BROWSER_BASE_HEAP_SNAPSHOT_ARTIFACT_URL'),
		headHeapSnapshotUrl: readRequiredEnv('FRONTEND_BROWSER_HEAD_HEAP_SNAPSHOT_ARTIFACT_URL'),
		detailedHtmlUrl: readOptionalEnv('FRONTEND_BROWSER_DETAILED_HTML_ARTIFACT_URL'),
	},
);

await writeFile(
	resolve(outputFileArg),
	renderFrontendDiagnosticsMarkdown(bundleMarkdown, browserMarkdown),
);
