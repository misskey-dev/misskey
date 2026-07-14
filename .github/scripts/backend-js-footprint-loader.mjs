/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { appendFileSync, statSync } from 'node:fs';
import { extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const traceFile = process.env.MK_BACKEND_JS_FOOTPRINT_TRACE;
const jsExtensions = new Set(['.js', '.mjs', '.cjs']);

function recordLoadedFile(kind, url, format) {
	if (traceFile == null || !url.startsWith('file:')) return;

	let filePath;
	try {
		filePath = fileURLToPath(url);
	} catch {
		return;
	}

	const extension = extname(filePath);
	if (!jsExtensions.has(extension)) return;

	let size = null;
	try {
		size = statSync(filePath).size;
	} catch {
		return;
	}

	appendFileSync(traceFile, `${JSON.stringify({
		kind,
		format,
		path: filePath,
		size,
		timestamp: Date.now(),
	})}\n`);
}

export async function load(url, context, nextLoad) {
	const result = await nextLoad(url, context);
	recordLoadedFile('esm', url, result.format ?? context.format ?? null);
	return result;
}
