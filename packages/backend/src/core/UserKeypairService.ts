import { Inject, Injectable } from '@nestjs/common';
import * as Redis from 'ioredis';
import type { User } from '@/models/entities/User.js';
import type { UserKeypairsRepository } from '@/models/index.js';
import { RedisKVCache } from '@/misc/cache.js';
import type { UserKeypair } from '@/models/entities/UserKeypair.js';
import { DI } from '@/di-symbols.js';
import { bindThis } from '@/decorators.js';

@Injectable()
export class UserKeypairService {
	private cache: RedisKVCache<UserKeypair>;

	constructor(
		@Inject(DI.redis)
		private redisClient: Redis.Redis,

		@Inject(DI.userKeypairsRepository)
		private userKeypairsRepository: UserKeypairsRepository,
	) {
		this.cache = new RedisKVCache<UserKeypair>(this.redisClient, 'userKeypair', {
			lifetime: 1000 * 60 * 60 * 24, // 24h
			memoryCacheLifetime: Infinity,
			fetcher: (key) => this.userKeypairsRepository.findOneByOrFail({ userId: key }),
			toRedisConverter: (value) => JSON.stringify(value),
			fromRedisConverter: (value) => JSON.parse(value),
		});
	}

	@bindThis
	public async getUserKeypair(userId: User['id']): Promise<UserKeypair> {
		return await this.cache.fetch(userId);
	}
}
