/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { spawn } from 'node:child_process';

function commandName(command: string) {
	// Windowsでは `pnpm` の実体がシェルスクリプトではなく `pnpm.cmd` なので直接spawnできない
	if (process.platform !== 'win32') return command;
	if (command === 'pnpm') return 'pnpm.cmd';
	return command;
}

export function run(command: string, args: string[], options: { cwd?: string; env?: NodeJS.ProcessEnv; logStdout?: boolean } = {}) {
	return new Promise<string>((resolvePromise, reject) => {
		const child = spawn(commandName(command), args, {
			cwd: options.cwd,
			env: options.env,
			stdio: ['ignore', 'pipe', 'pipe'],
		});

		let stdout = '';
		let stderr = '';

		child.stdout.on('data', data => {
			stdout += data;
			if (options.logStdout) process.stderr.write(data);
		});

		child.stderr.on('data', data => {
			stderr += data;
			process.stderr.write(data);
		});

		child.on('error', reject);

		child.on('close', code => {
			if (code === 0) {
				resolvePromise(stdout);
			} else {
				reject(new Error(`${command} ${args.join(' ')} failed with exit code ${code}\n${stderr}`));
			}
		});
	});
}
