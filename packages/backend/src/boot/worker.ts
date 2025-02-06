/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import cluster from 'node:cluster';
import { envOption } from '@/env.js';
import { WorkerArguments } from '@/boot/const.js';
import { sentryInit } from '@/boot/sentry.js';
import { ClusterWorkerType, Config, loadConfig } from '@/config.js';
import { actualClusterLimit, isHttpServerOnPrimary, jobQueue, server } from './common.js';

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

type WorkerSetting = {
	name?: string;
	type: ClusterWorkerType[];
}

export function computeWorkerArguments(config: Partial<Config>, envs: Partial<typeof envOption>): WorkerArguments[] {
	const clusterCount = actualClusterLimit(config);

	if (envs.onlyQueue && envs.onlyServer) {
		throw new Error('Cannot specify both onlyQueue and onlyServer');
	} else if (envs.onlyQueue) {
		// ぜんぶJobQueue
		return Array.from({ length: clusterCount }, (_, idx) => ({
			__workerName: 'job-queue',
			__workerIndex: idx,
			__moduleServer: false,
			__moduleJobQueue: true,
		}));
	} else if (envs.onlyServer) {
		// ぜんぶServer
		return Array.from({ length: clusterCount }, (_, idx) => ({
			__workerName: 'http-server',
			__workerIndex: idx,
			__moduleServer: true,
			__moduleJobQueue: false,
		}));
	} else if (isHttpServerOnPrimary(config)) {
		// メインプロセス上でHTTPサーバモジュールを動作させるconfig構成である場合、ワーカー側にはHTTPサーバの設定をしない
		return Array.from({ length: clusterCount }).map((_, idx) => ({
			__workerName: 'job-queue',
			__workerIndex: idx,
			__moduleServer: false,
			__moduleJobQueue: true,
		}));
	}

	// 扱いやすいようにWorkerの設定を展開
	const workerSettings: WorkerSetting[] = [];
	for (const worker of config.cluster?.workers ?? []) {
		for (let i = 0; i < worker.instances; i++) {
			workerSettings.push({
				name: worker.name,
				type: worker.type,
			});
		}
	}

	if (workerSettings.length < clusterCount) {
		// Workerの設定が足りない場合はデフォルト値で埋める
		for (let i = workerSettings.length; i < clusterCount; i++) {
			workerSettings.push({
				name: 'job-queue',
				type: ['jobQueue'],
			});
		}
	} else if (workerSettings.length > clusterCount) {
		// 何を削っていいかわからないのでWorkerの設定が多いときはエラーにする
		throw new Error('Too many worker settings');
	}

	return workerSettings.map((it, idx) => ({
		__workerIndex: idx,
		__workerName: it.name,
		__moduleServer: it.type.includes('http'),
		__moduleJobQueue: it.type.includes('jobQueue'),
	}));
}

export function parseWorkerArguments(args: Record<string, unknown>): WorkerArguments {
	return {
		__workerIndex: Number(args.__workerIndex),
		__workerName: args.__workerName ? args.__workerName.toString() : undefined,
		__moduleServer: args.__moduleServer === 'true' || args.__moduleServer === true,
		__moduleJobQueue: args.__moduleJobQueue === 'true' || args.__moduleJobQueue === true,
	};
}
