/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/**
 * Misskey の起動スクリプト
 *
 * 本体のエントリポイントの場所は内部仕様なので、起動手順はここに集約する
 */

import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { isAbsolute, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const originalCwd = process.cwd();
const backendDir = resolve(import.meta.dirname, '../packages/backend');
const require = createRequire(resolve(backendDir, 'package.json'));

const forwardedSignals = ['SIGTERM', 'SIGHUP'];
let stopRequested = false;

// SIGINT は端末から子プロセスにも直接届くので、このプロセスが先に終了しないよう無視するだけにする
process.on('SIGINT', () => {});

/**
 * 停止シグナルを子プロセスへ転送する
 * @param {import('node:child_process').ChildProcess} child
 * @returns {() => void} 転送を解除する関数
 */
function forwardSignals(child) {
	const handlers = forwardedSignals.map(signal => {
		const handler = () => {
			stopRequested = true;
			child.kill(signal);
		};
		process.on(signal, handler);
		return [signal, handler];
	});
	return () => {
		for (const [signal, handler] of handlers) process.off(signal, handler);
	};
}

/**
 * 前処理を子プロセスで実行し、失敗または停止要求があればその終了コードで終了する
 * @param {string[]} args
 */
async function runStep(args) {
	const child = spawn(process.execPath, args, {
		cwd: backendDir,
		stdio: 'inherit',
	});
	const stopForwarding = forwardSignals(child);
	const code = await new Promise((res, rej) => {
		child.once('error', rej);
		child.once('exit', res);
	}).finally(stopForwarding);
	if (stopRequested || code !== 0) process.exit(code ?? 1);
}

if (process.argv.includes('--migrate')) {
	await runStep([require.resolve('typeorm/cli.js'), 'migration:run', '-d', 'ormconfig.js']);
}

await runStep(['./scripts/check_connect.js']);

// モジュールを指定するオプション。パッケージ名の指定もできるため、相対パスの値だけを解決する
const moduleOptions = new Set([
	'--import',
	'--require',
	'-r',
	'--loader',
	'--experimental-loader',
]);

// ファイルやディレクトリのパスを指定するオプション
const pathOptions = new Set([
	'--env-file',
	'--env-file-if-exists',
	'--redirect-warnings',
	'--diagnostic-dir',
	'--report-dir',
	'--report-directory',
	'--cpu-prof-dir',
	'--heap-prof-dir',
	'--icu-data-dir',
	'--openssl-config',
	'--tls-keylog',
]);

/**
 * 相対パスの値を元の作業ディレクトリ基準で解決する
 * @param {string} name
 * @param {string} value
 */
function resolveOptionValue(name, value) {
	if (moduleOptions.has(name)) {
		if (!/^\.\.?[\\/]/.test(value)) return value;
		const path = resolve(originalCwd, value);
		return name === '--require' || name === '-r' ? path : pathToFileURL(path).href;
	}
	if (pathOptions.has(name) && !isAbsolute(value)) return resolve(originalCwd, value);
	return value;
}

// `node --max-old-space-size=... scripts/start.mjs` のように渡された Node.js のオプションを本体にも引き継ぐ。
// 作業ディレクトリを移動するので、相対パスは元の作業ディレクトリ基準で解決しておく
const execArgv = process.execArgv.map((arg, i, args) => {
	const eq = arg.indexOf('=');
	if (arg.startsWith('--') && eq !== -1) {
		const name = arg.slice(0, eq);
		return `${name}=${resolveOptionValue(name, arg.slice(eq + 1))}`;
	}
	const prev = args[i - 1];
	if (prev != null && (moduleOptions.has(prev) || pathOptions.has(prev))) return resolveOptionValue(prev, arg);
	return arg;
});

process.chdir(backendDir);

const entryArgs = [...execArgv, './built/entry.js'];

// プロセスを本体に置き換える（PIDも引き継がれる）
try {
	process.execve(process.execPath, [process.execPath, ...entryArgs], process.env);
} catch {
	// Windows など process.execve が使えない環境では子プロセスとして起動する
}

const child = spawn(process.execPath, entryArgs, { stdio: 'inherit' });
forwardSignals(child);

child.on('exit', (code, signal) => {
	if (signal != null) {
		// 本体と同じシグナルで終了する
		process.removeAllListeners(signal);
		process.kill(process.pid, signal);
	} else {
		process.exit(code ?? 1);
	}
});
