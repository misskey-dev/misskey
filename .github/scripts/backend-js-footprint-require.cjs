/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

'use strict';

const { appendFileSync, statSync } = require('node:fs');
const Module = require('node:module');
const { extname } = require('node:path');

const traceFile = process.env.MK_BACKEND_JS_FOOTPRINT_TRACE;
const jsExtensions = new Set(['.js', '.mjs', '.cjs']);

function recordLoadedFile(kind, filePath, request) {
	if (traceFile == null || typeof filePath !== 'string') return;

	const extension = extname(filePath);
	if (!jsExtensions.has(extension) && extension !== '.node') return;

	let size = null;
	try {
		size = statSync(filePath).size;
	} catch {
		return;
	}

	appendFileSync(traceFile, `${JSON.stringify({
		kind,
		format: extension === '.node' ? 'native' : 'commonjs',
		path: filePath,
		request,
		size,
		timestamp: Date.now(),
	})}\n`);
}

const originalLoad = Module._load;
const originalResolveFilename = Module._resolveFilename;

Module._load = function load(request, parent, isMain) {
	const resolved = originalResolveFilename.call(this, request, parent, isMain);
	const result = originalLoad.apply(this, arguments);
	recordLoadedFile('cjs', resolved, request);
	return result;
};
