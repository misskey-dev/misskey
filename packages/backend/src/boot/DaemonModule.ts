import { Ctor, IServiceCollection, addSingletonCtor } from 'yohira';
import { JanitorService } from '@/daemons/JanitorService.js';
import { QueueStatsService } from '@/daemons/QueueStatsService.js';
import { ServerStatsService } from '@/daemons/ServerStatsService.js';
import { DI } from '@/di-symbols.js';

const DaemonServices: readonly (readonly [symbol, Ctor<object>])[] = [
	[DI.JanitorService, JanitorService],
	[DI.QueueStatsService, QueueStatsService],
	[DI.ServerStatsService, ServerStatsService],
];

export function addDaemonServices(services: IServiceCollection): void {
	for (const [serviceType, implCtor] of DaemonServices) {
		addSingletonCtor(services, serviceType, implCtor);
	}
}
