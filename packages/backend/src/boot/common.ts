import {
	ServiceCollection,
	ServiceProviderOptions,
	addSingletonInstance,
	buildServiceProvider,
	getRequiredService,
} from 'yohira';
import { NestLogger } from '@/NestLogger.js';
import { addCoreServices } from '@/boot/CoreModule.js';
import { addGlobalServices, initializeGlobalServices } from '@/boot/GlobalModule.js';
import { addQueueServices } from '@/boot/QueueModule.js';
import { addQueueProcessorServices } from '@/boot/QueueProcessorModule.js';
import { addRepositoryServices } from '@/boot/RepositoryModule.js';
import { main } from '@/boot/main.js';
import { ChartManagementService } from '@/core/chart/ChartManagementService.js';
import { DI } from '@/di-symbols.js';
import { QueueProcessorService } from '@/queue/QueueProcessorService.js';

export function server(): Promise<void> {
	return main();
}

export async function jobQueue(): Promise<void> {
	const services = new ServiceCollection();
	addSingletonInstance(services, DI.Logger, new NestLogger());
	addRepositoryServices(services);
	addGlobalServices(services);
	addQueueServices(services);
	addCoreServices(services);
	addQueueProcessorServices(services);

	const options = new ServiceProviderOptions();
	options.validateOnBuild = process.env.NODE_ENV !== 'production';
	options.validateScopes = process.env.NODE_ENV !== 'production';
	const serviceProvider = buildServiceProvider(services, options);

	await initializeGlobalServices(serviceProvider);

	getRequiredService<QueueProcessorService>(serviceProvider, DI.QueueProcessorService).start();
	getRequiredService<ChartManagementService>(serviceProvider, DI.ChartManagementService).start();
}
