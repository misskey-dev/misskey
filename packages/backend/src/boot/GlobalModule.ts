import { Redis } from 'ioredis';
import { DataSource } from 'typeorm';
import {
	IServiceCollection,
	addSingletonFactory,
	getRequiredService,
	IServiceProvider,
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
		return Object.assign(db, {
			disposeAsync(): Promise<void> {
				return db.destroy();
			},
		});
	});

	addSingletonFactory(services, DI.redis, (services) => {
		const config = getRequiredService<Config>(services, DI.config);
		const redisClient = createRedisConnection(config);
		return Object.assign(redisClient, {
			dispose(): void {
				return redisClient.disconnect();
			},
		});
	});

	addSingletonFactory(services, DI.redisSubscriber, (services) => {
		const config = getRequiredService<Config>(services, DI.config);
		const redisSubscriber = createRedisConnection(config);
		return Object.assign(redisSubscriber, {
			dispose(): void {
				return redisSubscriber.disconnect();
			},
		});
	});
}

export async function initializeGlobalServices(serviceProvider: IServiceProvider): Promise<void> {
	// REVIEW
	const db = getRequiredService<DataSource>(serviceProvider, DI.db);
	await db.initialize();

	// REVIEW
	const config = getRequiredService<Config>(serviceProvider, DI.config);
	const redisSubscriber = getRequiredService<Redis>(serviceProvider, DI.redisSubscriber);
	await redisSubscriber.subscribe(config.host);
}
