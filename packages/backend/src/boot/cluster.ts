/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import cluster from 'node:cluster';
import type { Worker } from 'node:cluster';
import type { WorkerArguments } from '@/boot/const.js';

type ForkWorker = (env?: WorkerArguments) => Worker;

const forkWorker = cluster.fork as unknown as ForkWorker;
const workerArgumentsById = new Map<number, WorkerArguments>();

export function registerWorkerArguments(workerId: number, args: WorkerArguments): void {
	workerArgumentsById.set(workerId, { ...args });
}

export function forkConfiguredWorker(args: WorkerArguments, fork: ForkWorker = forkWorker): Worker {
	const worker = fork(args);
	registerWorkerArguments(worker.id, args);
	return worker;
}

export function forkReplacementWorker(worker: Worker, fork: ForkWorker = forkWorker): Worker {
	const args = workerArgumentsById.get(worker.id);
	workerArgumentsById.delete(worker.id);
	if (!args) {
		return fork();
	}

	return forkConfiguredWorker(args, fork);
}
