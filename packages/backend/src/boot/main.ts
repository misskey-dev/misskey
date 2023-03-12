import {
	ServiceCollection,
	ServiceProviderOptions,
	addSingletonInstance,
	buildServiceProvider,
	getRequiredService,
	ServiceProvider,
} from 'yohira';
import { NestLogger } from '@/NestLogger.js';
import { addCoreServices } from '@/boot/CoreModule.js';
import { addDaemonServices } from '@/boot/DaemonModule.js';
import { addEndpointsServices } from '@/boot/EndpointsModule.js';
import { addGlobalServices, initializeGlobalServices } from '@/boot/GlobalModule.js';
import { addQueueServices } from '@/boot/QueueModule.js';
import { addRepositoryServices } from '@/boot/RepositoryModule.js';
import { addServerServices } from '@/boot/ServerModule.js';
import { ChartManagementService } from '@/core/chart/ChartManagementService.js';
import { JanitorService } from '@/daemons/JanitorService.js';
import { QueueStatsService } from '@/daemons/QueueStatsService.js';
import { ServerStatsService } from '@/daemons/ServerStatsService.js';
import { DI } from '@/di-symbols.js';
import { ServerService } from '@/server/ServerService.js';
import { isVitestEnv } from '@/misc/is-vitest-env.js';

export async function main(): Promise<ServiceProvider> {
	const services = new ServiceCollection();

	addSingletonInstance(services, DI.Logger, new NestLogger());

	addGlobalServices(services);
	addQueueServices(services);
	addRepositoryServices(services);
	addEndpointsServices(services);
	addCoreServices(services);
	addServerServices(services);
	addDaemonServices(services);

	const options = new ServiceProviderOptions();
	options.validateOnBuild = process.env.NODE_ENV !== 'production';
	options.validateScopes = process.env.NODE_ENV !== 'production';
	const serviceProvider = buildServiceProvider(services, options);

	await initializeGlobalServices(serviceProvider);

	const serverService = getRequiredService<ServerService>(serviceProvider, DI.ServerService);
	await serverService.launch();

	// FIXME
	if (!isVitestEnv()) {
		getRequiredService<ChartManagementService>(serviceProvider, DI.ChartManagementService).start();
		getRequiredService<JanitorService>(serviceProvider, DI.JanitorService).start();
		getRequiredService<QueueStatsService>(serviceProvider, DI.QueueStatsService).start();
		getRequiredService<ServerStatsService>(serviceProvider, DI.ServerStatsService).start();
	}

	return serviceProvider;
}
