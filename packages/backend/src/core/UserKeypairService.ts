/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable, OnApplicationShutdown } from '@nestjs/common';
import * as Redis from 'ioredis';
import type { MiUser } from '@/models/User.js';
import type { UserKeypairsRepository } from '@/models/_.js';
import { RedisKVCache } from '@/misc/cache.js';
import type { MiUserKeypair } from '@/models/UserKeypair.js';
import { DI } from '@/di-symbols.js';
import { bindThis } from '@/decorators.js';
import { genEd25519KeyPair } from '@/misc/gen-key-pair.js';
import { GlobalEventService, GlobalEvents } from '@/core/GlobalEventService.js';

@Injectable()
export class UserKeypairService implements OnApplicationShutdown {
	private cache: RedisKVCache<MiUserKeypair>;

	constructor(
		@Inject(DI.redis)
		private redisClient: Redis.Redis,
		@Inject(DI.redisForSub)
		private redisForSub: Redis.Redis,
		@Inject(DI.userKeypairsRepository)
		private userKeypairsRepository: UserKeypairsRepository,

		private globalEventService: GlobalEventService,
	) {
		this.cache = new RedisKVCache<MiUserKeypair>(this.redisClient, 'userKeypair', {
			lifetime: 1000 * 60 * 60 * 24, // 24h
			memoryCacheLifetime: Infinity,
			fetcher: (key) => this.userKeypairsRepository.findOneByOrFail({ userId: key }),
			toRedisConverter: (value) => JSON.stringify(value),
			fromRedisConverter: (value) => JSON.parse(value),
		});

		this.redisForSub.on('message', this.onMessage);
	}

	@bindThis
	public async getUserKeypair(userId: MiUser['id']): Promise<MiUserKeypair> {
		return await this.cache.fetch(userId);
	}

	@bindThis
	public async refresh(userId: MiUser['id']): Promise<void> {
		return await this.cache.refresh(userId);
	}

	@bindThis
	public async prepareEd25519KeyPair(userId: MiUser['id']): Promise<void> {
		await this.refresh(userId);
		const keypair = await this.cache.fetch(userId);
		if (keypair.ed25519PublicKey != null) return;
		const ed25519 = await genEd25519KeyPair();
		await this.userKeypairsRepository.update({ userId }, {
			ed25519PublicKey: ed25519.publicKey,
			ed25519PrivateKey: ed25519.privateKey,
		});
		this.globalEventService.publishInternalEvent('userKeypairUpdated', { userId });
	}

	@bindThis
	private async onMessage(_: string, data: string): Promise<void> {
		const obj = JSON.parse(data);

		if (obj.channel === 'internal') {
			const { type, body } = obj.message as GlobalEvents['internal']['payload'];
			switch (type) {
				case 'userKeypairUpdated': {
					this.refresh(body.userId);
					break;
				}
			}
		}
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
