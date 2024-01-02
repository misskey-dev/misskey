/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { setTimeout } from 'node:timers/promises';
import process from 'node:process';
import { Global, Inject, Module } from '@nestjs/common';
import * as Redis from 'ioredis';
import { DataSource } from 'typeorm';
import { MeiliSearch } from 'meilisearch';
import { DI } from './di-symbols.js';
import { Config, loadConfig } from './config.js';
import { createPostgresDataSource } from './postgres.js';
import { RepositoryModule } from './models/RepositoryModule.js';
import type { Provider, OnApplicationShutdown } from '@nestjs/common';

const $config: Provider = {
	provide: DI.config,
	useValue: loadConfig(),
};

const $db: Provider = {
	provide: DI.db,
	useFactory: async (config) => {
		const db = createPostgresDataSource(config);
		return await db.initialize();
	},
	inject: [DI.config],
};

const $meilisearch: Provider = {
	provide: DI.meilisearch,
	useFactory: (config: Config) => {
		if (config.meilisearch) {
			return new MeiliSearch({
				host: `${config.meilisearch.ssl ? 'https' : 'http' }://${config.meilisearch.host}:${config.meilisearch.port}`,
				apiKey: config.meilisearch.apiKey,
			});
		} else {
			return null;
		}
	},
	inject: [DI.config],
};

const $redis: Provider = {
	provide: DI.redis,
	useFactory: (config: Config) => {
		return new Redis.Redis({
			...config.redis,
			reconnectOnError: (err: Error) => {
				if ( err.message.includes('READONLY')
					|| err.message.includes('ETIMEDOUT')
					|| err.message.includes('Command timed out')
				) return 2;
				return 1;
			},
		});
	},
	inject: [DI.config],
};

const $redisForPub: Provider = {
	provide: DI.redisForPub,
	useFactory: (config: Config) => {
		const redis = new Redis.Redis({
			...config.redisForPubsub,
			reconnectOnError: (err: Error) => {
				if ( err.message.includes('READONLY')
					|| err.message.includes('ETIMEDOUT')
					|| err.message.includes('Command timed out')
				) return 2;
				return 1;
			},
		});
		return redis;
	},
	inject: [DI.config],
};

const $redisForSub: Provider = {
	provide: DI.redisForSub,
	useFactory: (config: Config) => {
		const redis = new Redis.Redis({
			...config.redisForPubsub,
			reconnectOnError: (err: Error) => {
				if ( err.message.includes('READONLY')
					|| err.message.includes('ETIMEDOUT')
					|| err.message.includes('Command timed out')
				) return 2;
				return 1;
			},
		});
		redis.subscribe(config.host);
		return redis;
	},
	inject: [DI.config],
};

const $redisForTimelines: Provider = {
	provide: DI.redisForTimelines,
	useFactory: (config: Config) => {
		return new Redis.Redis({
			...config.redisForTimelines,
			reconnectOnError: (err: Error) => {
				if ( err.message.includes('READONLY')
					|| err.message.includes('ETIMEDOUT')
					|| err.message.includes('Command timed out')
				) return 2;
				return 1;
			},
		});
	},
	inject: [DI.config],
};

@Global()
@Module({
	imports: [RepositoryModule],
	providers: [$config, $db, $meilisearch, $redis, $redisForPub, $redisForSub, $redisForTimelines],
	exports: [$config, $db, $meilisearch, $redis, $redisForPub, $redisForSub, $redisForTimelines, RepositoryModule],
})
export class GlobalModule implements OnApplicationShutdown {
	constructor(
		@Inject(DI.db) private db: DataSource,
		@Inject(DI.redis) private redisClient: Redis.Redis,
		@Inject(DI.redisForPub) private redisForPub: Redis.Redis,
		@Inject(DI.redisForSub) private redisForSub: Redis.Redis,
		@Inject(DI.redisForTimelines) private redisForTimelines: Redis.Redis,
	) {}

	public async dispose(): Promise<void> {
		if (process.env.NODE_ENV === 'test') {
			// XXX:
			// Shutting down the existing connections causes errors on Jest as
			// Misskey has asynchronous postgres/redis connections that are not
			// awaited.
			// Let's wait for some random time for them to finish.
			await setTimeout(5000);
		}
		await Promise.all([
			this.db.destroy(),
			this.redisClient.disconnect(),
			this.redisForPub.disconnect(),
			this.redisForSub.disconnect(),
			this.redisForTimelines.disconnect(),
		]);
	}

	async onApplicationShutdown(signal: string): Promise<void> {
		await this.dispose();
		process.emitWarning('Misskey is shutting down', {
			code: 'MISSKEY_SHUTDOWN',
			detail: `Application received ${signal} signal`,
		});
	}
}
