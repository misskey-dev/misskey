/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { NestFactory } from '@nestjs/core';
import { ChartManagementService } from '@/core/chart/ChartManagementService.js';
import { QueueProcessorService } from '@/queue/QueueProcessorService.js';
import { NestLogger } from '@/NestLogger.js';
import { QueueProcessorModule } from '@/queue/QueueProcessorModule.js';
import { QueueStatsService } from '@/daemons/QueueStatsService.js';
import { ServerStatsService } from '@/daemons/ServerStatsService.js';
import { ServerService } from '@/server/ServerService.js';
import { MainModule } from '@/MainModule.js';

export async function server() {
	const app = await NestFactory.createApplicationContext(MainModule, {
		logger: new NestLogger(),
	});

	if (process.env.NODE_ENV !== 'test') {
		await app.get(ChartManagementService).start();
		await app.get(QueueStatsService).start();
		await app.get(ServerStatsService).start();
	}

	// Start server last so the other services can register hooks first
	const serverService = app.get(ServerService);
	await serverService.launch();

	return app;
}

export async function jobQueue() {
	const jobQueue = await NestFactory.createApplicationContext(QueueProcessorModule, {
		logger: new NestLogger(),
	});

	await jobQueue.get(QueueProcessorService).start();
	await jobQueue.get(ChartManagementService).start();

	return jobQueue;
}
