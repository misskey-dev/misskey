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

// 端末からの SIGINT は子プロセスにも直接届くので、このプロセスが先に終了しないよう既定の動作は無効にしておく
process.on('SIGINT', () => {
	stopRequested = true;
});

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

/**
 * Node.js のオプション列に含まれる相対パスを解決する
 * @param {string[]} args
 */
function resolveOptionArgs(args) {
	return args.map((arg, i) => {
		const eq = arg.indexOf('=');
		if (arg.startsWith('--') && eq !== -1) {
			const name = arg.slice(0, eq);
			return `${name}=${resolveOptionValue(name, arg.slice(eq + 1))}`;
		}
		const prev = args[i - 1];
		if (prev != null && (moduleOptions.has(prev) || pathOptions.has(prev))) return resolveOptionValue(prev, arg);
		return arg;
	});
}

/**
 * NODE_OPTIONS に含まれる相対パスを解決する。変更しない引数は元の記述（クォートを含む）のまま残す
 * @param {string} nodeOptions
 */
function resolveNodeOptions(nodeOptions) {
	// 空白区切りで `"` によるクォートと、クォート内の `\` によるエスケープを解釈する
	const tokens = [];
	let token = null;
	let inQuote = false;
	for (let i = 0; i < nodeOptions.length; i++) {
		const c = nodeOptions[i];
		if (c === ' ' && !inQuote) {
			if (token != null) tokens.push(token);
			token = null;
			continue;
		}
		token ??= { raw: '', value: '', quoted: false };
		if (inQuote && c === '\\' && i + 1 < nodeOptions.length) {
			token.raw += c + nodeOptions[i + 1];
			token.value += nodeOptions[++i];
		} else if (c === '"') {
			inQuote = !inQuote;
			token.quoted = true;
			token.raw += c;
		} else {
			token.raw += c;
			token.value += c;
		}
	}
	if (token != null) tokens.push(token);

	const resolved = resolveOptionArgs(tokens.map(t => t.value));
	return tokens.map((t, i) => {
		if (resolved[i] === t.value) return t.raw;
		return t.quoted || /[\s"\\]/.test(resolved[i]) ? `"${resolved[i].replace(/[\\"]/g, '\\$&')}"` : resolved[i];
	}).join(' ');
}

if (process.env.NODE_OPTIONS) {
	process.env.NODE_OPTIONS = resolveNodeOptions(process.env.NODE_OPTIONS);
}

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

	// 端末からの SIGINT なら子プロセスにも届いて即座に終了するので、終了していない場合だけ転送する
	const onSigint = () => {
		setTimeout(() => {
			if (child.exitCode == null && child.signalCode == null) child.kill('SIGINT');
		}, 100);
	};
	process.on('SIGINT', onSigint);

	const code = await new Promise((res, rej) => {
		child.once('error', rej);
		child.once('exit', res);
	}).finally(() => {
		stopForwarding();
		process.off('SIGINT', onSigint);
	});
	if (stopRequested || code !== 0) process.exit(code ?? 1);
}

if (process.argv.includes('--migrate')) {
	await runStep([require.resolve('typeorm/cli.js'), 'migration:run', '-d', 'ormconfig.js']);
}

await runStep(['./scripts/check_connect.js']);

// `node --max-old-space-size=... scripts/start.mjs` のように渡された Node.js のオプションを本体にも引き継ぐ。
// 作業ディレクトリを移動するので、相対パスは元の作業ディレクトリ基準で解決しておく
const execArgv = resolveOptionArgs(process.execArgv);

process.chdir(backendDir);

const entryArgs = [...execArgv, './built/entry.js'];

// プロセスを本体に置き換える（PIDも引き継がれる）
try {
	process.execve(process.execPath, [process.execPath, ...entryArgs], process.env);
} catch {
	// Windows など process.execve が使えない環境では子プロセスとして起動する
}

// 本体が同じデバッグポートを使えるよう、このプロセスの Inspector を閉じておく
const inspector = await import('node:inspector');
if (inspector.url() != null) inspector.close();

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
