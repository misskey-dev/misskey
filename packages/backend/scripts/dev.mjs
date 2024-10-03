/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { execa, execaNode } from 'execa';

/** @type {import('execa').ExecaChildProcess | undefined} */
let backendProcess;

async function execBuildAssets() {
	await execa('pnpm', ['run', 'build-assets'], {
		cwd: '../../',
		stdout: process.stdout,
		stderr: process.stderr,
	})
}

function execStart() {
	// pnpm run start を呼び出したいが、windowsだとプロセスグループ単位でのkillが出来ずゾンビプロセス化するので
	// 上記と同等の動きをするコマンドで子・孫プロセスを作らないようにしたい
	backendProcess = execaNode('./built/boot/entry.js', [], {
		stdout: process.stdout,
		stderr: process.stderr,
		env: {
			'NODE_ENV': 'development',
		},
	});
}

async function killProc() {
	if (backendProcess) {
		backendProcess.catch(() => {}); // backendProcess.kill()によって発生する例外を無視するためにcatch()を呼び出す
		backendProcess.kill();
		await new Promise(resolve => backendProcess.on('exit', resolve));
		backendProcess = undefined;
	}
}

(async () => {
	execaNode(
		'./node_modules/nodemon/bin/nodemon.js',
		[
			'-w', 'src',
			'-e', 'ts,js,mjs,cjs,json',
			'--exec', 'pnpm', 'run', 'build',
		],
		{
			stdio: [process.stdin, process.stdout, process.stderr, 'ipc'],
			serialization: "json",
		})
		.on('message', async (message) => {
			if (message.type === 'exit') {
				// かならずbuild->build-assetsの順番で呼び出したいので、
				// 少々トリッキーだがnodemonからのexitイベントを利用してbuild-assets->startを行う。
				// pnpm restartをbuildが終わる前にbuild-assetsが動いてしまうので、バラバラに呼び出す必要がある

				await killProc();
				await execBuildAssets();
				execStart();
			}
		})
})();
