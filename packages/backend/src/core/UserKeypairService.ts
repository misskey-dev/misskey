/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable, OnApplicationShutdown } from '@nestjs/common';
import * as Redis from 'ioredis';
import { genEd25519KeyPair } from '@misskey-dev/node-http-message-signatures';
import type { MiUser } from '@/models/User.js';
import type { UserKeypairsRepository } from '@/models/_.js';
import { RedisKVCache } from '@/misc/cache.js';
import type { MiUserKeypair } from '@/models/UserKeypair.js';
import { DI } from '@/di-symbols.js';
import { bindThis } from '@/decorators.js';
import { GlobalEventService, GlobalEvents } from '@/core/GlobalEventService.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';

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
		private userEntityService: UserEntityService,
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

	/**
	 *
	 * @param userIdOrHint user id or MiUserKeypair
	 * @param preferType If ed25519-like(`ed25519`, `01`, `11`) is specified, ed25519 keypair is returned if exists. Otherwise, main keypair is returned.
	 * @returns
	 */
	@bindThis
	public async getLocalUserKeypairWithKeyId(
		userIdOrHint: MiUser['id'] | MiUserKeypair, preferType?: string,
	): Promise<{ keyId: string; publicKey: string; privateKey: string; }> {
		const keypair = typeof userIdOrHint === 'string' ? await this.getUserKeypair(userIdOrHint) : userIdOrHint;
		if (
			preferType && ['01', '11', 'ed25519'].includes(preferType.toLowerCase()) &&
			keypair.ed25519PublicKey != null && keypair.ed25519PrivateKey != null
		) {
			return {
				keyId: `${this.userEntityService.genLocalUserUri(keypair.userId)}#ed25519-key`,
				publicKey: keypair.ed25519PublicKey,
				privateKey: keypair.ed25519PrivateKey,
			};
		}
		return {
			keyId: `${this.userEntityService.genLocalUserUri(keypair.userId)}#main-key`,
			publicKey: keypair.publicKey,
			privateKey: keypair.privateKey,
		};
	}

	@bindThis
	public async refresh(userId: MiUser['id']): Promise<void> {
		return await this.cache.refresh(userId);
	}

	/**
	 *
	 * @param userId user id
	 * @returns MiUserKeypair if keypair is created, void if keypair is already exists
	 */
	@bindThis
	public async refreshAndprepareEd25519KeyPair(userId: MiUser['id']): Promise<MiUserKeypair | void> {
		await this.refresh(userId);
		const keypair = await this.cache.fetch(userId);
		if (keypair.ed25519PublicKey != null) {
			return;
		}

		const ed25519 = await genEd25519KeyPair();
		await this.userKeypairsRepository.update({ userId }, {
			ed25519PublicKey: ed25519.publicKey,
			ed25519PrivateKey: ed25519.privateKey,
		});
		this.globalEventService.publishInternalEvent('userKeypairUpdated', { userId });
		return {
			...keypair,
			ed25519PublicKey: ed25519.publicKey,
			ed25519PrivateKey: ed25519.privateKey,
		};
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
