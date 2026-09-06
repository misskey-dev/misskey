/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable, OnApplicationShutdown } from '@nestjs/common';
import * as Redis from 'ioredis';
import * as nodeCrypto from 'crypto';
import type { MiUser } from '@/models/User.js';
import type { UserKeypairsRepository } from '@/models/_.js';
import { RedisKVCache } from '@/misc/cache.js';
import type { MiUserKeypair } from '@/models/UserKeypair.js';
import { DI } from '@/di-symbols.js';
import { bindThis } from '@/decorators.js';

@Injectable()
export class UserKeypairService implements OnApplicationShutdown {
	private cache: RedisKVCache<MiUserKeypair>;

	constructor(
		@Inject(DI.redis)
		private redisClient: Redis.Redis,

		@Inject(DI.userKeypairsRepository)
		private userKeypairsRepository: UserKeypairsRepository,
	) {
		this.cache = new RedisKVCache<MiUserKeypair>(this.redisClient, 'userKeypair:v2', {
			lifetime: 1000 * 60 * 60 * 24, // 24h
			memoryCacheLifetime: 1000 * 60 * 60, // 1h
			fetcher: (key) => this.fetcher(key),
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

	@bindThis
	public async fetcher(userId: MiUser['id']): Promise<MiUserKeypair> {
		const keyPair = await this.userKeypairsRepository.findOneByOrFail({ userId });

		// migrate PKCS#1 => PKCS#8. legacy misskey generated PKCS#1 but slacc only accepts PKCS#8
		if (keyPair.privateKey.includes('-----BEGIN RSA PRIVATE KEY-----')) {
			const pkcs8Key = nodeCrypto.createPrivateKey({ key: keyPair.privateKey, format: 'pem', type: 'pkcs1' }).export({ format: 'pem', type: 'pkcs8' });
			keyPair.privateKey = pkcs8Key;
			void this.userKeypairsRepository.update(userId, { privateKey: pkcs8Key });
		}

		return keyPair;
	}
}
