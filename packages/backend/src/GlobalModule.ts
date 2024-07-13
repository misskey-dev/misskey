/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import process from 'node:process';
import { Global, Inject, Module } from '@nestjs/common';
import * as Redis from 'ioredis';
import { DataSource } from 'typeorm';
import { MeiliSearch } from 'meilisearch';
import { Client as ElasticSearch } from '@elastic/elasticsearch';
import { DI } from './di-symbols.js';
import { Config, loadConfig } from './config.js';
import { createPostgresDataSource } from './postgres.js';
import { RepositoryModule } from './models/RepositoryModule.js';
import { allSettled } from './misc/promise-tracker.js';
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
				host: `${config.meilisearch.ssl ? 'https' : 'http'}://${config.meilisearch.host}:${config.meilisearch.port}`,
				apiKey: config.meilisearch.apiKey,
			});
		} else {
			return null;
		}
	},
	inject: [DI.config],
};

const $elasticsearch: Provider = {
	provide: DI.elasticsearch,
	useFactory: (config: Config) => {
		if (config.elasticsearch) {
			return new ElasticSearch({
				nodes: {
					url: new URL(`${config.elasticsearch.ssl ? 'https' : 'http'}://${config.elasticsearch.host}:${config.elasticsearch.port}`),
					ssl: {
						rejectUnauthorized: config.elasticsearch.rejectUnauthorized,
					},
				},
				auth: (config.elasticsearch.user && config.elasticsearch.pass) ? {
					username: config.elasticsearch.user,
					password: config.elasticsearch.pass,
				} : undefined,
				pingTimeout: 30000,
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
		const redis = new Redis.Redis({
			...config.redis,
			reconnectOnError: (err: Error) => {
				if ( err.message.includes('READONLY')
					|| err.message.includes('ETIMEDOUT')
					|| err.message.includes('Command timed out')
				) return 2;
				return 1;
			},
		});
		redis.defineCommand('setIf', {
			numberOfKeys: 1,
			lua: `
				if redis.call('GET', KEYS[1]) == ARGV[1] then
					return redis.call('SET', KEYS[1], ARGV[2])
				else
					return 0
				end
			`,
		});
		redis.defineCommand('unlinkIf', {
			numberOfKeys: 1,
			lua: `
				if redis.call('GET', KEYS[1]) == ARGV[1] then
					return redis.call('UNLINK', KEYS[1])
				else
					return 0
				end
			`,
		});
		return redis;
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
		const redis = new Redis.Redis({
			...config.redisForTimelines,
			reconnectOnError: (err: Error) => {
				if ( err.message.includes('READONLY')
					|| err.message.includes('ETIMEDOUT')
					|| err.message.includes('Command timed out')
				) return 2;
				return 1;
			},
		});
		redis.defineCommand('setIf', {
			numberOfKeys: 1,
			lua: `
				if redis.call('GET', KEYS[1]) == ARGV[1] then
					return redis.call('SET', KEYS[1], ARGV[2])
				else
					return 0
				end
			`,
		});
		redis.defineCommand('unlinkIf', {
			numberOfKeys: 1,
			lua: `
				if redis.call('GET', KEYS[1]) == ARGV[1] then
					return redis.call('UNLINK', KEYS[1])
				else
					return 0
				end
			`,
		});
		return redis;
	},
	inject: [DI.config],
};

@Global()
@Module({
	imports: [RepositoryModule],
	providers: [$config, $db, $meilisearch, $elasticsearch, $redis, $redisForPub, $redisForSub, $redisForTimelines],
	exports: [$config, $db, $meilisearch, $elasticsearch, $redis, $redisForPub, $redisForSub, $redisForTimelines, RepositoryModule],
})
export class GlobalModule implements OnApplicationShutdown {
	constructor(
		@Inject(DI.db) private db: DataSource,
		@Inject(DI.redis) private redisClient: Redis.Redis,
		@Inject(DI.redisForPub) private redisForPub: Redis.Redis,
		@Inject(DI.redisForSub) private redisForSub: Redis.Redis,
		@Inject(DI.redisForTimelines) private redisForTimelines: Redis.Redis,
	) { }

	public async dispose(): Promise<void> {
		// Wait for all potential DB queries
		await allSettled();
		// And then disconnect from DB
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
