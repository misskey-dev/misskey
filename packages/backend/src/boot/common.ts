/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import os from 'node:os';
import * as process from 'node:process';
import { INestApplicationContext } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Config } from '@/config.js';
import { ChartManagementService } from '@/core/chart/ChartManagementService.js';
import { QueueStatsService } from '@/daemons/QueueStatsService.js';
import { ServerStatsService } from '@/daemons/ServerStatsService.js';
import { MainModule } from '@/MainModule.js';
import { NestLogger } from '@/NestLogger.js';
import { QueueProcessorModule } from '@/queue/QueueProcessorModule.js';
import { QueueProcessorService } from '@/queue/QueueProcessorService.js';
import { ServerService } from '@/server/ServerService.js';

export async function server(): Promise<INestApplicationContext> {
	const app = await NestFactory.createApplicationContext(MainModule, {
		logger: new NestLogger(),
	});

	const serverService = app.get(ServerService);
	await serverService.launch();

	if (process.env.NODE_ENV !== 'test') {
		app.get(ChartManagementService).start();
		app.get(QueueStatsService).start();
		app.get(ServerStatsService).start();
	}

	return app;
}

export async function jobQueue(): Promise<INestApplicationContext> {
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
