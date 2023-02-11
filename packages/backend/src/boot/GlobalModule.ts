import {
	IServiceCollection,
	addSingletonFactory,
	getRequiredService,
} from 'yohira';
import { Config, loadConfig } from '@/config.js';
import { DI } from '@/di-symbols.js';
import { createPostgresDataSource } from '@/postgres.js';
import { createRedisConnection } from '@/redis.js';

// REVIEW
export function addGlobalServices(services: IServiceCollection): void {
	addSingletonFactory(services, DI.config, () => {
		const config = loadConfig();
		return config;
	});

	addSingletonFactory(services, DI.db, (services) => {
		const config = getRequiredService<Config>(services, DI.config);
		const db = createPostgresDataSource(config);
		// TODO: await db.destroy();
		return db;
	});

	addSingletonFactory(services, DI.redis, (services) => {
		const config = getRequiredService<Config>(services, DI.config);
		const redisClient = createRedisConnection(config);
		// TODO: redisClient.disconnect();
		return redisClient;
	});

	addSingletonFactory(services, DI.redisSubscriber, (services) => {
		const config = getRequiredService<Config>(services, DI.config);
		const redisSubscriber = createRedisConnection(config);
		redisSubscriber.subscribe(config.host);
		// TODO: redisSubscriber.disconnect();
		return redisSubscriber;
	});
}
