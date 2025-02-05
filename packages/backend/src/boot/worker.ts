/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import cluster from 'node:cluster';
import { envOption } from '@/env.js';
import { WorkerArguments } from '@/boot/const.js';
import { sentryInit } from '@/boot/sentry.js';
import { Config, loadConfig } from '@/config.js';
import { actualClusterLimit, jobQueue, server } from './common.js';

/**
 * Init worker process
 */
export async function workerMain(args: WorkerArguments) {
	const config = loadConfig();

	sentryInit(config);

	if (args.__moduleServer) {
		await server();
	}

	if (args.__moduleJobQueue) {
		await jobQueue();
	}

	if (cluster.isWorker) {
		// Send a 'ready' message to parent process
		process.send!('ready');
	}
}

export function computeWorkerArguments(workerIndex: number, config: Partial<Config>, envs: Partial<typeof envOption>): WorkerArguments {
	if (envs.onlyQueue && envs.onlyServer) {
		throw new Error('Cannot specify both onlyQueue and onlyServer');
	}

	const __moduleServer = moduleServer(workerIndex, config, envs);
	const __moduleJobQueue = moduleJobQueue(envs);

	if (config.cluster?.httpServer?.enableJobQueueProcessing) {
		return {
			__moduleServer,
			__moduleJobQueue,
		};
	} else {
		if (__moduleServer && __moduleJobQueue) {
			// HTTPサーバ+ジョブキューの同時起動が許されていない場合かつ両方とも起動条件を満たしている場合はHTTPサーバを優先
			return {
				__moduleServer: true,
				__moduleJobQueue: false,
			};
		} else {
			return {
				__moduleServer,
				__moduleJobQueue,
			};
		}
	}
}

function moduleServer(workerIndex: number, config: Partial<Config>, envs: Partial<typeof envOption>) {
	if (envs.onlyQueue) {
		return false;
	}

	const workers = actualClusterLimit(config);
	const requestHttpServerInstances = Math.min(config.cluster?.httpServer?.instances ?? 1, workers);
	if (requestHttpServerInstances <= 1) {
		// 1つ以下の場合はメインプロセスでHTTPサーバを起動する
		return false;
	}

	if ((workerIndex + 1) > requestHttpServerInstances) {
		// 連番のインデックスが要求されたHTTPサーバのインスタンス数を超えた場合、HTTPサーバを起動しない
		return false;
	}

	return true;
}

function moduleJobQueue(envs: Partial<typeof envOption>) {
	if (envs.onlyServer) {
		return false;
	}

	return true;
}

export function parseWorkerArguments(args: Record<string, unknown>): WorkerArguments {
	return {
		__moduleServer: args.__moduleServer === 'true' || args.__moduleServer === true,
		__moduleJobQueue: args.__moduleJobQueue === 'true' || args.__moduleJobQueue === true,
	};
}
