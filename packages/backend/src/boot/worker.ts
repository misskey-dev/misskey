import cluster from 'node:cluster';
import { NestFactory } from '@nestjs/core';
import { envOption } from '@/env.js';
import { ChartManagementService } from '@/core/chart/ChartManagementService.js';
import { ServerService } from '@/server/ServerService.js';
import { QueueProcessorService } from '@/queue/QueueProcessorService.js';
import { NestLogger } from '@/NestLogger.js';
import { RootModule } from '../RootModule.js';

/**
 * Init worker process
 */
export async function workerMain() {
	const app = await NestFactory.createApplicationContext(RootModule, {
		logger: new NestLogger(),
	});
	app.enableShutdownHooks();

	// start server
	const serverService = app.get(ServerService);
	serverService.launch();

	// start job queue
	if (!envOption.onlyServer) {
		const queueProcessorService = app.get(QueueProcessorService);
		queueProcessorService.start();
	}

	app.get(ChartManagementService).run();

	if (cluster.isWorker) {
		// Send a 'ready' message to parent process
		process.send!('ready');
	}
}
