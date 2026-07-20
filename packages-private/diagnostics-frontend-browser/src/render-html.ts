/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { renderHtml } from './report/html';
import type { BrowserMetricsReport } from './types';

async function main() {
	const [baseFileArg, headFileArg, outputFileArg] = process.argv.slice(2);
	if (baseFileArg == null || headFileArg == null || outputFileArg == null) {
		throw new Error('Usage: render-html <baseJson> <headJson> <outHtml>');
	}

	const base = JSON.parse(await readFile(resolve(baseFileArg), 'utf8')) as BrowserMetricsReport;
	const head = JSON.parse(await readFile(resolve(headFileArg), 'utf8')) as BrowserMetricsReport;

	await writeFile(resolve(outputFileArg), renderHtml(base, head));
}

await main().catch(err => {
	console.error(err);
	process.exit(1);
});
