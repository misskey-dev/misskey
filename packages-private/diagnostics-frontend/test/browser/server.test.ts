/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { EventEmitter } from 'node:events';
import { afterEach, expect, test, vi } from 'vitest';
import { stopServer, waitForServer } from '../../src/browser/server';
import type { ChildProcess } from 'node:child_process';

vi.mock('node:child_process', async () => {
	const actual = await vi.importActual<typeof import('node:child_process')>('node:child_process');
	return {
		...actual,
		spawnSync: vi.fn(),
	};
});

function signaledChild() {
	return Object.assign(new EventEmitter(), {
		exitCode: null,
		signalCode: 'SIGTERM' as NodeJS.Signals,
		pid: undefined,
		kill: vi.fn(),
	}) as unknown as ChildProcess;
}

afterEach(() => {
	vi.unstubAllGlobals();
});

test('waitForServer fails immediately when the server exited by signal', async () => {
	const fetchMock = vi.fn().mockResolvedValue({ status: 200 });
	vi.stubGlobal('fetch', fetchMock);

	await expect(waitForServer('http://127.0.0.1:61812', signaledChild()))
		.rejects.toThrow('Misskey server exited early with signal SIGTERM');
	expect(fetchMock).not.toHaveBeenCalled();
});

test('stopServer returns immediately when the server already exited by signal', async () => {
	const child = signaledChild();
	const stopPromise = stopServer(child);

	expect(child.listenerCount('exit')).toBe(0);
	await stopPromise;
});
