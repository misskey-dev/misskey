/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { readRequiredEnv } from 'diagnostics-shared/env';
import { renderMemoryReportMarkdown } from './report/markdown';
import type { MemoryReport } from './types';

async function main() {
	const [baseFileArg, headFileArg, outputFileArg] = process.argv.slice(2);
	if (baseFileArg == null || headFileArg == null || outputFileArg == null) {
		throw new Error('Usage: render-md <baseReport.json> <headReport.json> <output.md>');
	}

	const base = JSON.parse(await readFile(resolve(baseFileArg), 'utf8')) as MemoryReport;
	const head = JSON.parse(await readFile(resolve(headFileArg), 'utf8')) as MemoryReport;

	await writeFile(resolve(outputFileArg), renderMemoryReportMarkdown(base, head, {
		baseHeapSnapshotUrl: readRequiredEnv('MK_MEMORY_HEAP_SNAPSHOT_ARTIFACT_URL_BASE'),
		headHeapSnapshotUrl: readRequiredEnv('MK_MEMORY_HEAP_SNAPSHOT_ARTIFACT_URL_HEAD'),
	}));
}

await main().catch(err => {
	console.error(err);
	process.exit(1);
});
