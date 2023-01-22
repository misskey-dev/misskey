import cluster from 'node:cluster';
import { NestFactory } from '@nestjs/core';
import { ChartManagementService } from '@/core/chart/ChartManagementService.js';
import { QueueProcessorService } from '@/queue/QueueProcessorService.js';
import { NestLogger } from '@/NestLogger.js';
import { QueueProcessorModule } from '@/queue/QueueProcessorModule.js';

/**
 * Init worker process
 */
export async function workerMain() {
	const jobQueue = await NestFactory.createApplicationContext(QueueProcessorModule, {
		logger: new NestLogger(),
	});
	jobQueue.enableShutdownHooks();

	// start job queue
	jobQueue.get(QueueProcessorService).start();

	jobQueue.get(ChartManagementService).start();

	if (cluster.isWorker) {
		// Send a 'ready' message to parent process
		process.send!('ready');
	}
}
