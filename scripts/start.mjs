/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/**
 * Misskey の起動スクリプト
 *
 * 本体のエントリポイントの場所は内部仕様なので、起動手順はここに集約する
 */

import { spawn, spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';

const backendDir = resolve(import.meta.dirname, '../packages/backend');
const require = createRequire(resolve(backendDir, 'package.json'));

/**
 * 前処理を子プロセスで実行し、失敗したら同じ終了コードで終了する
 * @param {string[]} args
 */
function runStep(args) {
	const result = spawnSync(process.execPath, args, {
		cwd: backendDir,
		stdio: 'inherit',
	});
	if (result.error) throw result.error;
	if (result.status !== 0) process.exit(result.status ?? 1);
}

if (process.argv.includes('--migrate')) {
	runStep([require.resolve('typeorm/cli.js'), 'migration:run', '-d', 'ormconfig.js']);
}

runStep(['./scripts/check_connect.js']);

process.chdir(backendDir);

// `node --max-old-space-size=... scripts/start.mjs` のように渡された Node.js のオプションを本体にも引き継ぐ
const entryArgs = [...process.execArgv, './built/entry.js'];

// プロセスを本体に置き換える（PIDも引き継がれる）
try {
	process.execve(process.execPath, [process.execPath, ...entryArgs], process.env);
} catch {
	// Windows など process.execve が使えない環境では子プロセスとして起動する
}

const child = spawn(process.execPath, entryArgs, { stdio: 'inherit' });

// SIGINT は端末から本体にも直接届くので、このプロセスが先に終了しないよう無視するだけにする
process.on('SIGINT', () => {});
for (const signal of ['SIGTERM', 'SIGHUP']) {
	process.on(signal, () => child.kill(signal));
}

child.on('exit', (code, signal) => {
	if (signal != null) {
		// 本体と同じシグナルで終了する
		process.removeAllListeners(signal);
		process.kill(process.pid, signal);
	} else {
		process.exit(code ?? 1);
	}
});
