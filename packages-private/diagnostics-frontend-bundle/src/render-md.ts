/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { readRequiredEnv } from 'diagnostics-shared/env';
import { collectReport } from './manifest';
import { renderBundleReportMarkdown } from './report';
import type { VisualizerReport } from './visualizer';

async function main() {
	const [beforeDir, afterDir, beforeStatsFile, afterStatsFile, outFile] = process.argv.slice(2).map(arg => path.resolve(arg));
	// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
	if (outFile == null) throw new Error('Usage: render-md <beforeDir> <afterDir> <beforeStatsJson> <afterStatsJson> <outMd>');

	// 未設定のまま `undefined` という文字列をコメントに埋め込まないよう、ここで落とす
	const visualizerArtifactUrl = readRequiredEnv('FRONTEND_BUNDLE_REPORT_ARTIFACT_URL');

	const before = await collectReport(beforeDir);
	const after = await collectReport(afterDir);
	const beforeStats = JSON.parse(await fs.readFile(beforeStatsFile, 'utf8')) as VisualizerReport;
	const afterStats = JSON.parse(await fs.readFile(afterStatsFile, 'utf8')) as VisualizerReport;

	await fs.writeFile(outFile, renderBundleReportMarkdown(before, after, beforeStats, afterStats, { visualizerArtifactUrl }));
}

await main().catch(err => {
	console.error(err);
	process.exit(1);
});
