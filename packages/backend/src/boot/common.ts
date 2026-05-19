/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import os from 'node:os';
import * as process from 'node:process';
import { NestFactory } from '@nestjs/core';
import { init } from 'slacc';
import { NestLogger } from '@/NestLogger.js';
import type { Config } from '@/config.js';

let slaccInitialized = false;

export function initExtraThreadPool(config: Config) {
	if (slaccInitialized) return;

	const threadPoolSize = Math.max(config.threadPoolSize ?? 1, 1);

	init(threadPoolSize);

	slaccInitialized = true;
}

export async function server(options: { startStatsDaemons?: boolean } = {}) {
	const startStatsDaemons = options.startStatsDaemons ?? true;
	const { MainModule } = await import('../MainModule.js');
	const { ServerService } = await import('../server/ServerService.js');

	const app = await NestFactory.createApplicationContext(MainModule, {
		logger: new NestLogger(),
	});

	const serverService = app.get(ServerService);
	await serverService.launch();

	if (process.env.NODE_ENV !== 'test') {
		const { ChartManagementService } = await import('../core/chart/ChartManagementService.js');

		app.get(ChartManagementService).start();
		if (startStatsDaemons) {
			const { QueueStatsService } = await import('../daemons/QueueStatsService.js');
			const { ServerStatsService } = await import('../daemons/ServerStatsService.js');

			app.get(QueueStatsService).start();
			app.get(ServerStatsService).start();
		}
	}

	return app;
}

export async function jobQueue() {
	const { QueueProcessorModule } = await import('../queue/QueueProcessorModule.js');
	const { QueueProcessorService } = await import('../queue/QueueProcessorService.js');
	const { ChartManagementService } = await import('../core/chart/ChartManagementService.js');

	const jobQueue = await NestFactory.createApplicationContext(QueueProcessorModule, {
		logger: new NestLogger(),
	});

	jobQueue.get(QueueProcessorService).start();
	jobQueue.get(ChartManagementService).start();

	return jobQueue;
}

export function actualClusterLimit(config: Partial<Config>): number {
	return Math.min(config.clusterLimit ?? 1, cpuCount);
}

/** メインプロセス上でHTTPサーバモジュールを動作させるべきかを判断する */
export function isHttpServerOnPrimary(config: Partial<Config>): boolean {
	const actualLimit = actualClusterLimit(config);
	if (actualLimit === 1) {
		// - クラスタ数の設定が無い（デフォルト値1を使用）
		// - クラスタ数の設定が存在するものの、値が1である
		// - そもそもCPUコアが1つしかない
		return true;
	}

	if (!config.cluster?.workers || config.cluster.workers.length === 0) {
		// - ワーカーの構成が無い
		return true;
	}

	// ワーカーの構成が存在する＋httpサーバ用プロセスとする設定が1つ以下のようなケースも考えられるが、ケアしない
	// （明示的にそのようなconfigを記述しているので、挙動を理解したうえでの設定と判断する）
	return false;
}

// for testing
export function setCpuCount(count: number): void {
	// だいぶ苦肉の策だが、jestで上手くmockできないためこのような実装になっている
	if (process.env.NODE_ENV !== 'test') {
		throw new Error('This function is only available in test environment');
	}

	cpuCount = count;
}

// for testing
let cpuCount = os.cpus().length;
