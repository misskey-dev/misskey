import { NestFactory } from '@nestjs/core';
import { ChartManagementService } from '@/core/chart/ChartManagementService.js';
import { QueueProcessorService } from '@/queue/QueueProcessorService.js';
import { NestLogger } from '@/NestLogger.js';
import { QueueProcessorModule } from '@/queue/QueueProcessorModule.js';
import { main } from '@/boot/main.js';

export function server(): Promise<void> {
	return main();
}

export async function jobQueue() {
	const jobQueue = await NestFactory.createApplicationContext(QueueProcessorModule, {
		logger: new NestLogger(),
	});
	jobQueue.enableShutdownHooks();

	jobQueue.get(QueueProcessorService).start();
	jobQueue.get(ChartManagementService).start();
}
