/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { resolve } from 'node:path';
import { readOptionalEnv } from 'diagnostics-shared/env';
import { measureBackendMemory } from './measure';

// ローカルデバッグ用: バックエンド1回分の計測結果をJSONで出力する
const [backendDirArg] = process.argv.slice(2);

if (backendDirArg == null) {
	console.error('Usage: measure <backendDir>');
	process.exit(1);
}

try {
	const sample = await measureBackendMemory(resolve(backendDirArg), {
		heapSnapshotSavePath: readOptionalEnv('MK_MEMORY_HEAP_SNAPSHOT_SAVE_PATH'),
	});
	console.log(JSON.stringify(sample, null, 2));
} catch (err) {
	console.error(JSON.stringify({
		error: err instanceof Error ? err.message : String(err),
		timestamp: new Date().toISOString(),
	}));
	process.exit(1);
}
