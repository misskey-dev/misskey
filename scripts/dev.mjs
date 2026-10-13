/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execa } from 'execa';

const _filename = fileURLToPath(import.meta.url);
const _dirname = dirname(_filename);

/** @type {Set<import('execa').ResultPromise>} */
const childProcesses = new Set();
/** @type {Set<import('execa').ResultPromise>} */
const persistentChildProcesses = new Set();
let shuttingDown = false;
let persistentChildProcessesStarted = false;
let persistentChildProcessFailed = false;
/** @type {Promise<void> | null} */
let shutdownPromise = null;

/**
 * 開発用コマンドを起動し、終了時にまとめて停止できるよう追跡する。
 * Windows では Ctrl+C の配信先を分離し、出力を親コンソールへ中継する。
 *
 * @param {string} command - 実行するコマンド。
 * @param {string[]} args - コマンドへ渡す引数。
 * @param {import('execa').Options} options - execa の起動オプション。
 * @returns {import('execa').ResultPromise} 起動した子プロセス。
 */
function spawnChildProcess(command, args, options) {
	const isWindows = process.platform === 'win32';
	const shouldForceColor = (process.stdout.isTTY || process.stderr.isTTY)
		&& process.env.FORCE_COLOR == null
		&& process.env.NO_COLOR == null;
	const pnpmPath = _dirname + '/../node_modules/pnpm/bin/pnpm.mjs';
	const windowsCommand = [process.execPath, pnpmPath, ...args]
		.map(argument => `"${argument}"`)
		.join(' ');
	const executable = isWindows && command === 'pnpm' ? process.env.ComSpec ?? 'cmd.exe' : command;
	const executableArgs = isWindows && command === 'pnpm'
		? ['/d', '/s', '/c', `start "" /b /wait ${windowsCommand}`]
		: args;
	const childProcess = execa(executable, executableArgs, isWindows ? {
		...options,
		// `start /b` keeps the process in the current console without forwarding
		// Ctrl+C, allowing only this supervisor to coordinate the shutdown.
		windowsVerbatimArguments: true,
		windowsHide: false,
		env: shouldForceColor ? { FORCE_COLOR: '1' } : undefined,
		stdout: 'pipe',
		stderr: 'pipe',
		buffer: false,
	} : options);

	if (isWindows) {
		if (options.stdout != null) childProcess.stdout?.pipe(options.stdout, { end: false });
		if (options.stderr != null) childProcess.stderr?.pipe(options.stderr, { end: false });
	}

	childProcesses.add(childProcess);
	return childProcess;
}

/**
 * 子プロセスの終了を待機し、追跡対象から取り除く。
 *
 * @param {string} command - 実行するコマンド。
 * @param {string[]} args - コマンドへ渡す引数。
 * @param {import('execa').Options} options - execa の起動オプション。
 * @returns {Promise<import('execa').Result>} 子プロセスの実行結果。
 */
async function runChildProcess(command, args, options) {
	const childProcess = spawnChildProcess(command, args, options);

	try {
		return await childProcess;
	} finally {
		childProcesses.delete(childProcess);
	}
}

/**
 * 常駐する子プロセスがすべて終了していれば、終了結果を引き継いで親も終了する。
 *
 * @returns {void}
 */
function shutdownIfAllPersistentChildProcessesStopped() {
	if (shuttingDown || !persistentChildProcessesStarted || persistentChildProcesses.size > 0) return;

	void shutdown(persistentChildProcessFailed ? 1 : 0);
}

/**
 * 常駐する子プロセスを起動し、終了時の追跡解除・エラー出力・親の終了判定を設定する。
 *
 * @param {string} command - 実行するコマンド。
 * @param {string[]} args - コマンドへ渡す引数。
 * @param {import('execa').Options} options - execa の起動オプション。
 * @returns {void}
 */
function startChildProcess(command, args, options) {
	const childProcess = spawnChildProcess(command, args, options);
	persistentChildProcesses.add(childProcess);

	void childProcess.then(() => {
		childProcesses.delete(childProcess);
		persistentChildProcesses.delete(childProcess);
		shutdownIfAllPersistentChildProcessesStopped();
	}, error => {
		childProcesses.delete(childProcess);
		persistentChildProcesses.delete(childProcess);
		if (!shuttingDown) {
			persistentChildProcessFailed = true;
			console.error(error);
			shutdownIfAllPersistentChildProcessesStopped();
		}
	});
}

/**
 * 子プロセスとその配下のプロセスを停止し、終了を待機する。
 *
 * @param {import('execa').ResultPromise} childProcess - 停止する子プロセス。
 * @returns {Promise<void>}
 */
async function stopChildProcess(childProcess) {
	if (process.platform === 'win32' && childProcess.pid != null) {
		const result = await execa('taskkill', ['/pid', childProcess.pid.toString(), '/t', '/f'], {
			reject: false,
		});
		if (result.failed) childProcess.kill();
	} else {
		childProcess.kill();
	}

	await childProcess.catch(() => {});
}

/**
 * 追跡中の子プロセスを一度だけ停止して、指定した終了コードで終了する。
 *
 * @param {number} exitCode - 親プロセスに返す終了コード。
 * @returns {Promise<void>} 実行中または完了した停止処理。
 */
function shutdown(exitCode) {
	if (shutdownPromise != null) return shutdownPromise;

	shuttingDown = true;
	shutdownPromise = (async () => {
		await Promise.allSettled([...childProcesses].map(stopChildProcess));
		process.exit(exitCode);
	})();

	return shutdownPromise;
}

process.on('SIGINT', () => {
	void shutdown(0);
});

process.on('SIGTERM', () => {
	void shutdown(0);
});

try {
	await runChildProcess('pnpm', ['clean'], {
		cwd: _dirname + '/../',
		stdout: process.stdout,
		stderr: process.stderr,
	});

	// アセットのビルドで依存しているので一番最初に必要
	await runChildProcess('pnpm', ['--filter', 'i18n', 'build'], {
		cwd: _dirname + '/../',
		stdout: process.stdout,
		stderr: process.stderr,
	});

	await Promise.all([
		runChildProcess('pnpm', ['build-pre'], {
			cwd: _dirname + '/../',
			stdout: process.stdout,
			stderr: process.stderr,
		}),
		runChildProcess('pnpm', ['build-assets'], {
			cwd: _dirname + '/../',
			stdout: process.stdout,
			stderr: process.stderr,
		}),
		runChildProcess('pnpm', ['--filter', 'backend...', '--filter=!backend', 'build'], {
			cwd: _dirname + '/../',
			stdout: process.stdout,
			stderr: process.stderr,
		}),
		// icons-subsetterは開発段階では使用されないが、型エラーを抑制するためにはじめの一度だけビルドする
		runChildProcess('pnpm', ['--filter', 'icons-subsetter', 'build'], {
			cwd: _dirname + '/../',
			stdout: process.stdout,
			stderr: process.stderr,
		}),
		runChildProcess('pnpm', ['--filter', 'misskey-js', 'build'], {
			cwd: _dirname + '/../',
			stdout: process.stdout,
			stderr: process.stderr,
		}),
	]);

	startChildProcess('pnpm', ['build-pre', '--watch'], {
		cwd: _dirname + '/../',
		stdout: process.stdout,
		stderr: process.stderr,
	});

	startChildProcess('pnpm', ['build-assets', '--watch'], {
		cwd: _dirname + '/../',
		stdout: process.stdout,
		stderr: process.stderr,
	});

	startChildProcess('pnpm', ['--filter', 'backend', 'dev'], {
		cwd: _dirname + '/../',
		stdout: process.stdout,
		stderr: process.stderr,
	});

	startChildProcess('pnpm', ['--filter', 'frontend', 'watch'], {
		cwd: _dirname + '/../',
		stdout: process.stdout,
		stderr: process.stderr,
	});

	startChildProcess('pnpm', ['--filter', 'frontend-embed', 'watch'], {
		cwd: _dirname + '/../',
		stdout: process.stdout,
		stderr: process.stderr,
	});

	startChildProcess('pnpm', ['--filter', 'sw', 'watch'], {
		cwd: _dirname + '/../',
		stdout: process.stdout,
		stderr: process.stderr,
	});

	startChildProcess('pnpm', ['--filter', 'misskey-js', 'watch', '--no-clean'], {
		cwd: _dirname + '/../',
		stdout: process.stdout,
		stderr: process.stderr,
	});

	startChildProcess('pnpm', ['--filter', 'i18n', 'watch', '--no-clean'], {
		cwd: _dirname + '/../',
		stdout: process.stdout,
		stderr: process.stderr,
	});

	startChildProcess('pnpm', ['--filter', 'misskey-reversi', 'watch', '--no-clean'], {
		cwd: _dirname + '/../',
		stdout: process.stdout,
		stderr: process.stderr,
	});

	startChildProcess('pnpm', ['--filter', 'misskey-bubble-game', 'watch', '--no-clean'], {
		cwd: _dirname + '/../',
		stdout: process.stdout,
		stderr: process.stderr,
	});

	persistentChildProcessesStarted = true;
	shutdownIfAllPersistentChildProcessesStopped();
} catch (error) {
	if (!shuttingDown) {
		console.error(error);
		await shutdown(1);
	}
}
