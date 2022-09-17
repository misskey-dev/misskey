import { Global, Inject, Module } from '@nestjs/common';
import { Redis } from 'ioredis';
import { DataSource } from 'typeorm';
import { createRedisConnection } from '@/redis.js';
import { DI } from './di-symbols.js';
import { loadConfig } from './config.js';
import { db } from './postgre.js';
import { RepositoryModule } from './RepositoryModule.js';
import type { Provider, OnApplicationShutdown } from '@nestjs/common';

const config = loadConfig();

const $config: Provider = {
	provide: DI.config,
	useValue: config,
};

const $db: Provider = {
	provide: DI.db,
	useValue: db,
};

const $redis: Provider = {
	provide: DI.redis,
	useFactory: () => {
		const redisClient = createRedisConnection();
		return redisClient;
	},
};

const $redisSubscriber: Provider = {
	provide: DI.redisSubscriber,
	useFactory: () => {
		const redisSubscriber = createRedisConnection();
		redisSubscriber.subscribe(config.host);
		return redisSubscriber;
	},
};

@Global()
@Module({
	imports: [RepositoryModule],
	providers: [$config, $db, $redis, $redisSubscriber],
	exports: [$config, $db, $redis, $redisSubscriber, RepositoryModule],
})
export class GlobalModule implements OnApplicationShutdown {
	constructor(
		@Inject(DI.db) private db: DataSource,
		@Inject(DI.redis) private redisClient: Redis,
		@Inject(DI.redisSubscriber) private redisSubscriber: Redis,
	) {}

	async onApplicationShutdown(signal: string): Promise<void> {
		await Promise.all([
			this.db.destroy(),
			this.redisClient.disconnect(),
			this.redisSubscriber.disconnect(),
		]);
	}
}
