import { Inject, Injectable } from '@nestjs/common';
import * as Redis from 'ioredis';
import type { InstancesRepository } from '@/models/index.js';
import type { Instance } from '@/models/entities/Instance.js';
import { MemoryKVCache, RedisKVCache } from '@/misc/cache.js';
import { IdService } from '@/core/IdService.js';
import { DI } from '@/di-symbols.js';
import { UtilityService } from '@/core/UtilityService.js';
import { bindThis } from '@/decorators.js';

@Injectable()
export class FederatedInstanceService {
	public federatedInstanceCache: RedisKVCache<Instance | null>;

	constructor(
		@Inject(DI.redis)
		private redisClient: Redis.Redis,

		@Inject(DI.instancesRepository)
		private instancesRepository: InstancesRepository,

		private utilityService: UtilityService,
		private idService: IdService,
	) {
		this.federatedInstanceCache = new RedisKVCache<Instance | null>(this.redisClient, 'federatedInstance', {
			lifetime: 1000 * 60 * 60 * 24, // 24h
			memoryCacheLifetime: 1000 * 60 * 30, // 30m
			fetcher: (key) => this.instancesRepository.findOneBy({ host: key }),
			toRedisConverter: (value) => JSON.stringify(value),
			fromRedisConverter: (value) => {
				const parsed = JSON.parse(value);
				if (parsed == null) return null;
				return {
					...parsed,
					firstRetrievedAt: new Date(parsed.firstRetrievedAt),
					latestRequestReceivedAt: parsed.latestRequestReceivedAt ? new Date(parsed.latestRequestReceivedAt) : null,
					infoUpdatedAt: parsed.infoUpdatedAt ? new Date(parsed.infoUpdatedAt) : null,
				};
			},
		});
	}

	@bindThis
	public async fetch(host: string): Promise<Instance> {
		host = this.utilityService.toPuny(host);
	
		const cached = await this.federatedInstanceCache.get(host);
		if (cached) return cached;
	
		const index = await this.instancesRepository.findOneBy({ host });
	
		if (index == null) {
			const i = await this.instancesRepository.insert({
				id: this.idService.genId(),
				host,
				firstRetrievedAt: new Date(),
			}).then(x => this.instancesRepository.findOneByOrFail(x.identifiers[0]));
	
			this.federatedInstanceCache.set(host, i);
			return i;
		} else {
			this.federatedInstanceCache.set(host, index);
			return index;
		}
	}

	@bindThis
	public async updateCachePartial(host: string, data: Partial<Instance>): Promise<void> {
		host = this.utilityService.toPuny(host);
	
		const cached = await this.federatedInstanceCache.get(host);
		if (cached == null) return;
	
		this.federatedInstanceCache.set(host, {
			...cached,
			...data,
		});
	}
}
