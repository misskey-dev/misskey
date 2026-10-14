/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { fork, type ChildProcess } from 'node:child_process';
import { join } from 'node:path';
import { bytesToKiB } from './proc';

type GcMessage = 'gc ok' | 'gc unavailable';
type RuntimeMemoryUsageMessage = {
	type: 'memory usage';
	value: NodeJS.MemoryUsage;
};
type HeapSnapshotMessage = {
	type: 'heap snapshot';
	path?: string;
};
type HeapSnapshotErrorMessage = {
	type: 'heap snapshot error';
	message: string;
};
type HeapSnapshotResponseMessage = HeapSnapshotMessage | HeapSnapshotErrorMessage;

function isRecord(value: unknown): value is Record<string, unknown> {
	return value != null && typeof value === 'object';
}

function isGcMessage(message: unknown): message is GcMessage {
	return message === 'gc ok' || message === 'gc unavailable';
}

function isRuntimeMemoryUsageMessage(message: unknown): message is RuntimeMemoryUsageMessage {
	return isRecord(message) && message.type === 'memory usage' && isRecord(message.value);
}

function isHeapSnapshotResponseMessage(message: unknown): message is HeapSnapshotResponseMessage {
	if (!isRecord(message)) return false;
	if (message.type === 'heap snapshot') return true;
	return message.type === 'heap snapshot error' && typeof message.message === 'string';
}

export function waitForMessage<T>(serverProcess: ChildProcess, predicate: (message: unknown) => message is T, description: string, timeout: number) {
	return new Promise<T>((resolve, reject) => {
		const cleanup = () => {
			globalThis.clearTimeout(timer);
			serverProcess.off('message', onMessage);
			serverProcess.off('exit', onExit);
			serverProcess.off('error', onError);
			serverProcess.off('disconnect', onDisconnect);
		};

		const timer = globalThis.setTimeout(() => {
			cleanup();
			reject(new Error(`Timed out waiting for ${description}`));
		}, timeout);

		const onMessage = (message: unknown) => {
			if (!predicate(message)) return;
			cleanup();
			resolve(message);
		};

		// 子が死んだ場合、待ち続けてもメッセージは来ない。
		// タイムアウトまで待って誤解を招くエラーを出すより、理由を添えて即座に失敗させる
		const onExit = (code: number | null, signal: string | null) => {
			cleanup();
			reject(new Error(`Server exited (code=${code}, signal=${signal}) while waiting for ${description}`));
		};

		const onError = (err: Error) => {
			cleanup();
			reject(new Error(`Server errored while waiting for ${description}: ${err.message}`));
		};

		const onDisconnect = () => {
			cleanup();
			reject(new Error(`Server IPC channel closed while waiting for ${description}`));
		};

		serverProcess.on('message', onMessage);
		serverProcess.once('exit', onExit);
		serverProcess.once('error', onError);
		serverProcess.once('disconnect', onDisconnect);
	});
}

/**
 * ビルド済みバックエンドを子プロセスとして起動する。
 * execArgv は親から引き継がず `--expose-gc` のみを渡す: 親は tsx 経由で動くため、
 * 引き継ぐと計測対象プロセスにTSローダーが載ってしまいメモリ量が歪む。
 */
export function forkBackendServer(backendDir: string) {
	return fork(join(backendDir, 'built/entry.js'), [], {
		cwd: backendDir,
		env: {
			...process.env,
			NODE_ENV: 'production',
			MK_DISABLE_CLUSTERING: '1',
			MK_ONLY_SERVER: '1',
			MK_NO_DAEMONS: '1',
		},
		stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
		execArgv: ['--expose-gc'],
	});
}

export function waitForServerReady(serverProcess: ChildProcess, timeout: number) {
	return waitForMessage(
		serverProcess,
		(message): message is 'ok' => message === 'ok',
		'server startup',
		timeout,
	);
}

export async function triggerGc(serverProcess: ChildProcess, timeout: number) {
	// 送信前にlistenerを張らないと、応答を取りこぼす可能性がある
	const ok = waitForMessage(serverProcess, isGcMessage, 'GC completion', timeout);

	serverProcess.send('gc');

	const message = await ok;
	if (message === 'gc unavailable') {
		throw new Error('GC is unavailable. Start the process with --expose-gc to enable this feature.');
	}
}

export async function getRuntimeMemoryUsage(serverProcess: ChildProcess, timeout: number) {
	const response = waitForMessage(
		serverProcess,
		isRuntimeMemoryUsageMessage,
		'memory usage',
		timeout,
	);

	serverProcess.send('memory usage');

	const message = await response;
	const memoryUsage = message.value;

	// /proc 由来の値と単位を揃える
	return {
		HeapTotal: bytesToKiB(memoryUsage.heapTotal),
		HeapUsed: bytesToKiB(memoryUsage.heapUsed),
		External: bytesToKiB(memoryUsage.external),
		ArrayBuffers: bytesToKiB(memoryUsage.arrayBuffers),
	};
}

/**
 * heap snapshotの書き出しを依頼し、実際に書かれたパスを返す。
 */
export async function requestHeapSnapshot(serverProcess: ChildProcess, snapshotPath: string, timeout: number) {
	const response = waitForMessage(
		serverProcess,
		isHeapSnapshotResponseMessage,
		'heap snapshot',
		timeout,
	);

	serverProcess.send({
		type: 'heap snapshot',
		path: snapshotPath,
	});

	const message = await response;
	if (message.type === 'heap snapshot error') {
		throw new Error(`Failed to write heap snapshot: ${message.message}`);
	}

	return typeof message.path === 'string' ? message.path : snapshotPath;
}

/**
 * SIGTERMで終了を促し、一定時間で落ちなければSIGKILLする。
 */
export async function shutdownBackendServer(serverProcess: ChildProcess) {
	// 既に終了しているなら 'exit' はもう発火しないので、待つと無駄に10秒止まる
	if (serverProcess.exitCode != null || serverProcess.signalCode != null) return;

	await new Promise<void>(resolve => {
		let forceTimer: NodeJS.Timeout | undefined;
		const termTimer = globalThis.setTimeout(() => {
			serverProcess.kill('SIGKILL');
			// SIGKILLは無視できないので通常はここで 'exit' が来る。
			// D状態などで落ちない場合に計測全体を止めないよう、待ち時間には上限を設ける
			forceTimer = globalThis.setTimeout(resolve, 5000);
		}, 10000);

		serverProcess.once('exit', () => {
			globalThis.clearTimeout(termTimer);
			if (forceTimer != null) globalThis.clearTimeout(forceTimer);
			resolve();
		});

		serverProcess.kill('SIGTERM');
	});
}
