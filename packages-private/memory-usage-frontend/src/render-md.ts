/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { readOptionalEnv, readRequiredEnv } from 'diagnostics-shared/env';
import { renderMarkdown } from './report/markdown';
import type { BrowserMetricsReport } from './types';

async function main() {
	const [baseFileArg, headFileArg, outputFileArg] = process.argv.slice(2);
	if (baseFileArg == null || headFileArg == null || outputFileArg == null) {
		throw new Error('Usage: render-md <baseJson> <headJson> <outMd>');
	}

	const base = JSON.parse(await readFile(resolve(baseFileArg), 'utf8')) as BrowserMetricsReport;
	const head = JSON.parse(await readFile(resolve(headFileArg), 'utf8')) as BrowserMetricsReport;

	await writeFile(resolve(outputFileArg), renderMarkdown(base, head, {
		baseHeapSnapshotUrl: readRequiredEnv('FRONTEND_BROWSER_BASE_HEAP_SNAPSHOT_ARTIFACT_URL'),
		headHeapSnapshotUrl: readRequiredEnv('FRONTEND_BROWSER_HEAD_HEAP_SNAPSHOT_ARTIFACT_URL'),
		detailedHtmlUrl: readOptionalEnv('FRONTEND_BROWSER_DETAILED_HTML_ARTIFACT_URL'),
	}));
}

await main().catch(err => {
	console.error(err);
	process.exit(1);
});
