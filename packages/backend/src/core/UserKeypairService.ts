/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { OnApplicationShutdown } from '@nestjs/common';
import { Inject, Injectable, } from '@nestjs/common';
import type * as Redis from 'ioredis';
import { bindThis } from '@/decorators.js';
import { DI } from '@/di-symbols.js';
import { RedisKVCache } from '@/misc/cache.js';
import type { UserKeypairsRepository } from '@/models/_.js';
import type { MiUser } from '@/models/User.js';
import type { MiUserKeypair } from '@/models/UserKeypair.js';

@Injectable()
export class UserKeypairService implements OnApplicationShutdown {
	private cache: RedisKVCache<MiUserKeypair>;

	constructor(
		@Inject(DI.redis)
		private redisClient: Redis.Redis,

		@Inject(DI.userKeypairsRepository)
		private userKeypairsRepository: UserKeypairsRepository,
	) {
		this.cache = new RedisKVCache<MiUserKeypair>(this.redisClient, 'userKeypair', {
			lifetime: 1000 * 60 * 60 * 24, // 24h
			memoryCacheLifetime: 1000 * 60 * 60, // 1h
			fetcher: (key) => this.userKeypairsRepository.findOneByOrFail({ userId: key }),
			toRedisConverter: (value) => JSON.stringify(value),
			fromRedisConverter: (value) => JSON.parse(value),
		});
	}

	@bindThis
	public async getUserKeypair(userId: MiUser['id']): Promise<MiUserKeypair> {
		return await this.cache.fetch(userId);
	}

	@bindThis
	public dispose(): void {
		this.cache.dispose();
	}

	@bindThis
	public onApplicationShutdown(signal?: string | undefined): void {
		this.dispose();
	}
}
