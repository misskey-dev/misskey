/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { spawn, spawnSync, type ChildProcess } from 'node:child_process';

export function sleep(ms: number) {
	return new Promise(resolvePromise => setTimeout(resolvePromise, ms));
}

function commandName(command: string) {
	if (process.platform !== 'win32') return command;
	if (command === 'pnpm') return 'pnpm.cmd';
	return command;
}

/**
 * 計測対象のリポジトリで Misskey テストサーバーを起動する。
 * POSIXでは detached にして、後で子孫プロセスごとまとめて落とせるようにする。
 */
export function startServer(label: string, repoDir: string) {
	process.stderr.write(`[${label}] Starting Misskey test server\n`);
	const child = spawn(commandName('pnpm'), ['start:test'], {
		cwd: repoDir,
		env: process.env,
		stdio: ['ignore', 'pipe', 'pipe'],
		detached: process.platform !== 'win32',
	});
	child.stdout.on('data', data => process.stderr.write(`[server:${label}] ${data}`));
	child.stderr.on('data', data => process.stderr.write(`[server:${label}] ${data}`));
	return child;
}

const serverStartupTimeoutMs = 120_000;

export async function waitForServer(baseUrl: string, child: ChildProcess) {
	const startedAt = Date.now();
	while (Date.now() - startedAt < serverStartupTimeoutMs) {
		if (child.exitCode != null) throw new Error(`Misskey server exited early with code ${child.exitCode}`);
		try {
			// 応答が返らないままだとfetchが待ち続け、外側の120秒の上限を超えてしまう
			const remainingMs = serverStartupTimeoutMs - (Date.now() - startedAt);
			const response = await fetch(`${baseUrl}/`, {
				redirect: 'manual',
				signal: AbortSignal.timeout(remainingMs),
			});
			if (response.status < 500) return;
		} catch {
			// 中断・接続拒否いずれもまだ起動中とみなしてリトライする
		}
		await sleep(1_000);
	}
	throw new Error(`Timed out waiting for ${baseUrl}`);
}

export async function stopServer(child: ChildProcess) {
	if (child.exitCode != null) return;

	if (process.platform === 'win32') {
		spawnSync('taskkill', ['/pid', String(child.pid), '/t', '/f'], { stdio: 'ignore' });
	} else if (child.pid != null) {
		try {
			// プロセスグループごと落とさないと pnpm 配下の node が残る
			process.kill(-child.pid, 'SIGTERM');
		} catch {
			child.kill('SIGTERM');
		}
	}

	await new Promise<void>(resolvePromise => {
		if (child.exitCode != null) {
			resolvePromise();
			return;
		}

		const forceKillTimer = setTimeout(() => {
			// 猶予の間に終了していれば、PIDが再利用されて無関係のプロセスを撃つ恐れがある
			if (child.exitCode == null && child.pid != null) {
				try {
					if (process.platform === 'win32') {
						spawnSync('taskkill', ['/pid', String(child.pid), '/t', '/f'], { stdio: 'ignore' });
					} else {
						process.kill(-child.pid, 'SIGKILL');
					}
				} catch {
					child.kill('SIGKILL');
				}
			}
			resolvePromise();
		}, 10_000);
		forceKillTimer.unref();

		child.once('exit', () => {
			clearTimeout(forceKillTimer);
			resolvePromise();
		});
	});
}
