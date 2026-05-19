/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Worker } from 'node:cluster';
import { describe, expect, test, vi } from 'vitest';
import { forkReplacementWorker, registerWorkerArguments } from '@/boot/cluster.js';
import type { WorkerArguments } from '@/boot/const.js';

describe('cluster', () => {
	test('workerの再起動時に元のworker引数を引き継ぐ', () => {
		const args: WorkerArguments = {
			__workerIndex: 1,
			__workerName: 'http-server',
			__moduleServer: true,
			__moduleJobQueue: false,
			__moduleStats: true,
		};
		const replacement = { id: 99 } as Worker;
		const fork = vi.fn(() => replacement);

		registerWorkerArguments(12, args);
		const result = forkReplacementWorker({ id: 12 } as Worker, fork);

		expect(result).toBe(replacement);
		expect(fork).toHaveBeenCalledWith(args);
	});

	test('引数を保持していないworkerは従来通り引数なしで再起動する', () => {
		const replacement = { id: 100 } as Worker;
		const fork = vi.fn(() => replacement);

		const result = forkReplacementWorker({ id: 13 } as Worker, fork);

		expect(result).toBe(replacement);
		expect(fork).toHaveBeenCalledWith();
	});
});
