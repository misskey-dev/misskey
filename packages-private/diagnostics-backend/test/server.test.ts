/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { EventEmitter } from 'node:events';
import type { ChildProcess } from 'node:child_process';
import { describe, expect, test } from 'vitest';
import { waitForMessage } from '../src/measure/server';

/** waitForMessage が使うのは message/exit/error/disconnect の購読だけなので EventEmitter で足りる */
function createFakeServer() {
	return new EventEmitter() as unknown as ChildProcess;
}

function isPing(message: unknown): message is 'ping' {
	return message === 'ping';
}

describe('waitForMessage', () => {
	test('resolves with the first matching message', async () => {
		const server = createFakeServer();
		const received = waitForMessage(server, isPing, 'ping', 1_000);

		server.emit('message', 'noise');
		server.emit('message', 'ping');

		await expect(received).resolves.toBe('ping');
	});

	// 子が死んだあとメッセージは来ないので、タイムアウトまで待たずに理由を添えて失敗させる
	test('rejects immediately when the server exits', async () => {
		const server = createFakeServer();
		const received = waitForMessage(server, isPing, 'ping', 60_000);

		server.emit('exit', 1, null);

		await expect(received).rejects.toThrow(/Server exited \(code=1, signal=null\) while waiting for ping/);
	});

	test('rejects immediately when the server errors', async () => {
		const server = createFakeServer();
		const received = waitForMessage(server, isPing, 'ping', 60_000);

		server.emit('error', new Error('spawn failed'));

		await expect(received).rejects.toThrow(/spawn failed/);
	});

	test('rejects immediately when the IPC channel closes', async () => {
		const server = createFakeServer();
		const received = waitForMessage(server, isPing, 'ping', 60_000);

		server.emit('disconnect');

		await expect(received).rejects.toThrow(/IPC channel closed/);
	});

	test('rejects on timeout', async () => {
		const server = createFakeServer();
		await expect(waitForMessage(server, isPing, 'ping', 1)).rejects.toThrow(/Timed out waiting for ping/);
	});

	// 待機が終わった後もリスナーが残っていると、ラウンドを重ねるごとに積み上がる
	test('removes every listener once settled', async () => {
		const server = createFakeServer();
		const emitter = server as unknown as EventEmitter;
		const received = waitForMessage(server, isPing, 'ping', 1_000);

		server.emit('message', 'ping');
		await received;

		for (const event of ['message', 'exit', 'error', 'disconnect']) {
			expect(emitter.listenerCount(event)).toBe(0);
		}
	});
});
