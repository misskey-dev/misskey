/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { resolve } from 'node:path';
import { compareBackendMemory } from './compare';

const [baseDirArg, headDirArg, baseOutputArg, headOutputArg] = process.argv.slice(2);

// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
if (baseDirArg == null || headDirArg == null || baseOutputArg == null || headOutputArg == null) {
	console.error('Usage: inspect <baseDir> <headDir> <baseOutput> <headOutput>');
	process.exit(1);
}

try {
	await compareBackendMemory({
		baseDir: resolve(baseDirArg),
		headDir: resolve(headDirArg),
		baseOutput: resolve(baseOutputArg),
		headOutput: resolve(headOutputArg),
	});
} catch (err) {
	console.error(err);
	process.exit(1);
}
