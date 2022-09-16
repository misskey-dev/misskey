import { Global, Module } from '@nestjs/common';
import { DI } from './di-symbols.js';
import { loadConfig } from './config.js';
import { db } from './db/postgre.js';
import { redisClient, redisSubscriber } from './db/redis.js';
import { RepositoryModule } from './RepositoryModule.js';
import type { Provider } from '@nestjs/common';

const $config: Provider = {
	provide: DI.config,
	useValue: loadConfig(),
};

const $db: Provider = {
	provide: DI.db,
	useValue: db,
};

const $redis: Provider = {
	provide: DI.redis,
	useValue: redisClient,
};

const $redisSubscriber: Provider = {
	provide: DI.redisSubscriber,
	useValue: redisSubscriber,
};

@Global()
@Module({
	imports: [RepositoryModule],
	providers: [$config, $db, $redis, $redisSubscriber],
	exports: [$config, $db, $redis, $redisSubscriber, RepositoryModule],
})
export class GlobalModule {}
