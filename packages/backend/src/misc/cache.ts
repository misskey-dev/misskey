/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as Redis from 'ioredis';
import { bindThis } from '@/decorators.js';
import type { MemoryKVConfig, MemorySingleConfig, RedisKVConfig, RedisSingleConfig } from '@/config.js';

export class RedisKVCache<T> {
	private redisClient: Redis.Redis;
	private name: string;
	private lifetime: number;
	private memoryCache: MemoryKVCache<T>;
	private fetcher: (key: string) => Promise<T>;
	private toRedisConverter: (value: T) => string;
	private fromRedisConverter: (value: string) => T | undefined;

	constructor(redisClient: RedisKVCache<T>['redisClient'], name: RedisKVCache<T>['name'], opts: {
		config: RedisKVConfig;
		fetcher: RedisKVCache<T>['fetcher'];
		toRedisConverter: RedisKVCache<T>['toRedisConverter'];
		fromRedisConverter: RedisKVCache<T>['fromRedisConverter'];
	}) {
		if (opts.config.redis.lifetime <= 0) {
			throw new Error(`Redis cache lifetime of ${opts.config.redis.lifetime} is invalid - it must be greater than zero`);
		}
		if (opts.config.memory.lifetime <= 0) {
			throw new Error(`Memory cache lifetime of ${opts.config.memory.lifetime} is invalid - it must be greater than zero`);
		}
		if (opts.config.memory.capacity <= 0) {
			throw new Error(`Memory cache capacity of ${opts.config.memory.capacity} is invalid - it must be greater than zero`);
		}
		this.redisClient = redisClient;
		this.name = name;
		this.lifetime = opts.config.redis.lifetime;
		this.memoryCache = new MemoryKVCache(opts.config);
		this.fetcher = opts.fetcher;
		this.toRedisConverter = opts.toRedisConverter;
		this.fromRedisConverter = opts.fromRedisConverter;
	}

	@bindThis
	public async set(key: string, value: T): Promise<void> {
		this.memoryCache.set(key, value);
		if (this.lifetime === Infinity) {
			await this.redisClient.set(
				`kvcache:${this.name}:${key}`,
				this.toRedisConverter(value),
			);
		} else {
			await this.redisClient.set(
				`kvcache:${this.name}:${key}`,
				this.toRedisConverter(value),
				'EX', Math.round(this.lifetime / 1000),
			);
		}
	}

	@bindThis
	public async get(key: string): Promise<T | undefined> {
		const memoryCached = this.memoryCache.get(key);
		if (memoryCached !== undefined) return memoryCached;

		const cached = await this.redisClient.get(`kvcache:${this.name}:${key}`);
		if (cached == null) return undefined;
		return this.fromRedisConverter(cached);
	}

	@bindThis
	public async delete(key: string): Promise<void> {
		this.memoryCache.delete(key);
		await this.redisClient.del(`kvcache:${this.name}:${key}`);
	}

	/**
	 * キャッシュがあればそれを返し、無ければfetcherを呼び出して結果をキャッシュ&返します
	 */
	@bindThis
	public async fetch(key: string): Promise<T> {
		const cachedValue = await this.get(key);
		if (cachedValue !== undefined) {
			// Cache HIT
			return cachedValue;
		}

		// Cache MISS
		const value = await this.fetcher(key);
		this.set(key, value);
		return value;
	}

	@bindThis
	public async refresh(key: string) {
		const value = await this.fetcher(key);
		this.set(key, value);

		// TODO: イベント発行して他プロセスのメモリキャッシュも更新できるようにする
	}
}

export class RedisSingleCache<T> {
	private redisClient: Redis.Redis;
	private name: string;
	private lifetime: number;
	private memoryCache: MemorySingleCache<T>;
	private fetcher: () => Promise<T>;
	private toRedisConverter: (value: T) => string;
	private fromRedisConverter: (value: string) => T | undefined;

	constructor(redisClient: RedisSingleCache<T>['redisClient'], name: RedisSingleCache<T>['name'], opts: {
		config: RedisSingleConfig;
		fetcher: RedisSingleCache<T>['fetcher'];
		toRedisConverter: RedisSingleCache<T>['toRedisConverter'];
		fromRedisConverter: RedisSingleCache<T>['fromRedisConverter'];
	}) {
		if (opts.config.redis.lifetime <= 0) {
			throw new Error(`Redis cache lifetime of ${opts.config.redis.lifetime} is invalid - it must be greater than zero`);
		}
		if (opts.config.memory.lifetime <= 0) {
			throw new Error(`Memory cache lifetime of ${opts.config.memory.lifetime} is invalid - it must be greater than zero`);
		}
		this.redisClient = redisClient;
		this.name = name;
		this.lifetime = opts.config.redis.lifetime;
		this.memoryCache = new MemorySingleCache(opts.config);
		this.fetcher = opts.fetcher;
		this.toRedisConverter = opts.toRedisConverter;
		this.fromRedisConverter = opts.fromRedisConverter;
	}

	@bindThis
	public async set(value: T): Promise<void> {
		this.memoryCache.set(value);
		if (this.lifetime === Infinity) {
			await this.redisClient.set(
				`singlecache:${this.name}`,
				this.toRedisConverter(value),
			);
		} else {
			await this.redisClient.set(
				`singlecache:${this.name}`,
				this.toRedisConverter(value),
				'EX', Math.round(this.lifetime / 1000),
			);
		}
	}

	@bindThis
	public async get(): Promise<T | undefined> {
		const memoryCached = this.memoryCache.get();
		if (memoryCached !== undefined) return memoryCached;

		const cached = await this.redisClient.get(`singlecache:${this.name}`);
		if (cached == null) return undefined;
		return this.fromRedisConverter(cached);
	}

	@bindThis
	public async delete(): Promise<void> {
		this.memoryCache.delete();
		await this.redisClient.del(`singlecache:${this.name}`);
	}

	/**
	 * キャッシュがあればそれを返し、無ければfetcherを呼び出して結果をキャッシュ&返します
	 */
	@bindThis
	public async fetch(): Promise<T> {
		const cachedValue = await this.get();
		if (cachedValue !== undefined) {
			// Cache HIT
			return cachedValue;
		}

		// Cache MISS
		const value = await this.fetcher();
		this.set(value);
		return value;
	}

	@bindThis
	public async refresh() {
		const value = await this.fetcher();
		this.set(value);

		// TODO: イベント発行して他プロセスのメモリキャッシュも更新できるようにする
	}
}

export class MemoryKVCache<T> {
	private readonly cache = new Map<string, CacheEntry<T>>;
	private readonly lifetime: number;
	private readonly capacity: number;

	constructor(config: MemoryKVConfig) {
		if (config.memory.lifetime <= 0) {
			throw new Error(`Memory cache lifetime of ${config.memory.lifetime} is invalid - it must be greater than zero`);
		}
		if (config.memory.capacity <= 0) {
			throw new Error(`Memory cache capacity of ${config.memory.capacity} is invalid - it must be greater than zero`);
		}

		this.lifetime = config.memory.lifetime;
		this.capacity = config.memory.capacity;
	}

	@bindThis
	/**
	 * Mapにキャッシュをセットします
	 * @deprecated これを直接呼び出すべきではない。InternalEventなどで変更を全てのプロセス/マシンに通知するべき
	 */
	public set(key: string, value: T): void {
		this.delete(key);

		// If the map is full, then we need to evict something
		if (this.cache.size >= this.capacity) {
			this.evictOldestKey();
		}

		this.cache.set(key, {
			timeout: setTimeout(() => this.delete(key), this.lifetime),
			lastUsed: Date.now(),
			value,
		});
	}

	@bindThis
	public get(key: string): T | undefined {
		const entry = this.cache.get(key);

		// Update last-used time and reset eviction
		if (entry) {
			clearTimeout(entry.timeout);
			entry.timeout = setTimeout(() => this.delete(key), this.lifetime);
			entry.lastUsed = Date.now();
		}

		return entry?.value;
	}

	@bindThis
	public delete(key: string): void {
		// Clear eviction timer
		const timeout = this.cache.get(key)?.timeout;
		if (timeout) {
			clearTimeout(timeout);
		}

		this.cache.delete(key);
	}

	/**
	 * キャッシュがあればそれを返し、無ければfetcherを呼び出して結果をキャッシュ&返します
	 * optional: キャッシュが存在してもvalidatorでfalseを返すとキャッシュ無効扱いにします
	 */
	@bindThis
	public async fetch(key: string, fetcher: () => Promise<T>, validator?: (cachedValue: T) => boolean): Promise<T> {
		const cachedValue = this.get(key);
		if (cachedValue !== undefined) {
			if (validator) {
				if (validator(cachedValue)) {
					// Cache HIT
					return cachedValue;
				}
			} else {
				// Cache HIT
				return cachedValue;
			}
		}

		// Cache MISS
		const value = await fetcher();
		this.set(key, value);
		return value;
	}

	/**
	 * キャッシュがあればそれを返し、無ければfetcherを呼び出して結果をキャッシュ&返します
	 * optional: キャッシュが存在してもvalidatorでfalseを返すとキャッシュ無効扱いにします
	 */
	@bindThis
	public async fetchMaybe(key: string, fetcher: () => Promise<T | undefined>, validator?: (cachedValue: T) => boolean): Promise<T | undefined> {
		const cachedValue = this.get(key);
		if (cachedValue !== undefined) {
			if (validator) {
				if (validator(cachedValue)) {
					// Cache HIT
					return cachedValue;
				}
			} else {
				// Cache HIT
				return cachedValue;
			}
		}

		// Cache MISS
		const value = await fetcher();
		if (value !== undefined) {
			this.set(key, value);
		}
		return value;
	}

	private evictOldestKey(): void {
		let oldestKey;

		let oldestAge = Number.MAX_VALUE;
		for (const [key, value] of this.cache.entries()) {
			if (value.lastUsed < oldestAge) {
				oldestAge = value.lastUsed;
				oldestKey = key;
			}
		}

		if (oldestKey) {
			this.delete(oldestKey);
		}
	}

	public entries() {
		return this.cache.entries();
	}
}

interface CacheEntry<T> {
	timeout: NodeJS.Timeout;
	lastUsed: number;
	value: T;
}

export class MemorySingleCache<T> {
	private cachedAt: number | null = null;
	private value: T | undefined;
	private readonly lifetime: number;

	constructor(config: MemorySingleConfig) {
		if (config.memory.lifetime <= 0) {
			throw new Error(`Cache lifetime of ${config.memory.lifetime} is invalid - it must be greater than zero`);
		}
		this.lifetime = config.memory.lifetime;
	}

	@bindThis
	public set(value: T): void {
		this.cachedAt = Date.now();
		this.value = value;
	}

	@bindThis
	public get(): T | undefined {
		if (this.cachedAt == null) return undefined;
		if ((Date.now() - this.cachedAt) > this.lifetime) {
			this.value = undefined;
			this.cachedAt = null;
			return undefined;
		}
		return this.value;
	}

	@bindThis
	public delete() {
		this.value = undefined;
		this.cachedAt = null;
	}

	/**
	 * キャッシュがあればそれを返し、無ければfetcherを呼び出して結果をキャッシュ&返します
	 * optional: キャッシュが存在してもvalidatorでfalseを返すとキャッシュ無効扱いにします
	 */
	@bindThis
	public async fetch(fetcher: () => Promise<T>, validator?: (cachedValue: T) => boolean): Promise<T> {
		const cachedValue = this.get();
		if (cachedValue !== undefined) {
			if (validator) {
				if (validator(cachedValue)) {
					// Cache HIT
					return cachedValue;
				}
			} else {
				// Cache HIT
				return cachedValue;
			}
		}

		// Cache MISS
		const value = await fetcher();
		this.set(value);
		return value;
	}

	/**
	 * キャッシュがあればそれを返し、無ければfetcherを呼び出して結果をキャッシュ&返します
	 * optional: キャッシュが存在してもvalidatorでfalseを返すとキャッシュ無効扱いにします
	 */
	@bindThis
	public async fetchMaybe(fetcher: () => Promise<T | undefined>, validator?: (cachedValue: T) => boolean): Promise<T | undefined> {
		const cachedValue = this.get();
		if (cachedValue !== undefined) {
			if (validator) {
				if (validator(cachedValue)) {
					// Cache HIT
					return cachedValue;
				}
			} else {
				// Cache HIT
				return cachedValue;
			}
		}

		// Cache MISS
		const value = await fetcher();
		if (value !== undefined) {
			this.set(value);
		}
		return value;
	}
}
