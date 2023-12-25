/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as Redis from 'ioredis';
import { bindThis } from '@/decorators.js';

export class RedisKVCache<T> {
	private redisClient: Redis.Redis;
	private name: string;
	private lifetime: number;
	private memoryCache: MemoryKVCache<T>;
	private fetcher: (key: string) => Promise<T>;
	private toRedisConverter: (value: T) => string;
	private fromRedisConverter: (value: string) => T | undefined;

	constructor(redisClient: RedisKVCache<T>['redisClient'], name: RedisKVCache<T>['name'], opts: {
		lifetime: RedisKVCache<T>['lifetime'];
		memoryCacheLifetime: number;
		fetcher: RedisKVCache<T>['fetcher'];
		toRedisConverter: RedisKVCache<T>['toRedisConverter'];
		fromRedisConverter: RedisKVCache<T>['fromRedisConverter'];
	}) {
		this.redisClient = redisClient;
		this.name = name;
		this.lifetime = opts.lifetime;
		this.memoryCache = new MemoryKVCache(opts.memoryCacheLifetime);
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

	@bindThis
	public gc() {
		this.memoryCache.gc();
	}

	@bindThis
	public dispose() {
		this.memoryCache.dispose();
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
		lifetime: RedisSingleCache<T>['lifetime'];
		memoryCacheLifetime: number;
		fetcher: RedisSingleCache<T>['fetcher'];
		toRedisConverter: RedisSingleCache<T>['toRedisConverter'];
		fromRedisConverter: RedisSingleCache<T>['fromRedisConverter'];
	}) {
		this.redisClient = redisClient;
		this.name = name;
		this.lifetime = opts.lifetime;
		this.memoryCache = new MemorySingleCache(opts.memoryCacheLifetime);
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

// TODO: メモリ節約のためあまり参照されないキーを定期的に削除できるようにする？

function nothingToDo<T, V = T>(value: T): V {
	return value as unknown as V;
}

export class MemoryKVCache<T, V = T> {
	public cache: Map<string, { date: number; value: V; }>;
	private lifetime: number;
	private gcIntervalHandle: NodeJS.Timeout;
	private toMapConverter: (value: T) => V;
	private fromMapConverter: (cached: V) => T | undefined;

	constructor(lifetime: MemoryKVCache<never>['lifetime'], options: {
		toMapConverter: (value: T) => V;
		fromMapConverter: (cached: V) => T | undefined;
	} = {
		toMapConverter: nothingToDo,
		fromMapConverter: nothingToDo,
	}) {
		this.cache = new Map();
		this.lifetime = lifetime;
		this.toMapConverter = options.toMapConverter;
		this.fromMapConverter = options.fromMapConverter;

		this.gcIntervalHandle = setInterval(() => {
			this.gc();
		}, 1000 * 60 * 3);
	}

	@bindThis
	public set(key: string, value: T): void {
		this.cache.set(key, {
			date: Date.now(),
			value: this.toMapConverter(value),
		});
	}

	@bindThis
	public get(key: string): T | undefined {
		const cached = this.cache.get(key);
		if (cached == null) return undefined;
		if ((Date.now() - cached.date) > this.lifetime) {
			this.cache.delete(key);
			return undefined;
		}
		return this.fromMapConverter(cached.value);
	}

	@bindThis
	public delete(key: string): void {
		this.cache.delete(key);
	}

	/**
	 * キャッシュがあればそれを返し、無ければfetcherを呼び出して結果をキャッシュ&返します
	 * optional: キャッシュが存在してもvalidatorでfalseを返すとキャッシュ無効扱いにします
	 * fetcherの引数はcacheに保存されている値があれば渡されます
	 */
	@bindThis
	public async fetch(key: string, fetcher: (value: V | undefined) => Promise<T>, validator?: (cachedValue: T) => boolean): Promise<T> {
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
		const value = await fetcher(this.cache.get(key)?.value);
		this.set(key, value);
		return value;
	}

	/**
	 * キャッシュがあればそれを返し、無ければfetcherを呼び出して結果をキャッシュ&返します
	 * optional: キャッシュが存在してもvalidatorでfalseを返すとキャッシュ無効扱いにします
	 * fetcherの引数はcacheに保存されている値があれば渡されます
	 */
	@bindThis
	public async fetchMaybe(key: string, fetcher: (value: V | undefined) => Promise<T | undefined>, validator?: (cachedValue: T) => boolean): Promise<T | undefined> {
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
		const value = await fetcher(this.cache.get(key)?.value);
		if (value !== undefined) {
			this.set(key, value);
		}
		return value;
	}

	@bindThis
	public gc(): void {
		const now = Date.now();
		for (const [key, { date }] of this.cache.entries()) {
			if ((now - date) > this.lifetime) {
				this.cache.delete(key);
			}
		}
	}

	@bindThis
	public dispose(): void {
		clearInterval(this.gcIntervalHandle);
	}
}

export class MemorySingleCache<T> {
	private cachedAt: number | null = null;
	private value: T | undefined;
	private lifetime: number;

	constructor(lifetime: MemorySingleCache<never>['lifetime']) {
		this.lifetime = lifetime;
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
