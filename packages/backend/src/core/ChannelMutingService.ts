/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { DI } from '@/di-symbols.js';
import type { ChannelMutingRepository, MiChannel, MiUser } from '@/models/_.js';
import { IdService } from '@/core/IdService.js';
import { GlobalEvents, GlobalEventService } from '@/core/GlobalEventService.js';
import { bindThis } from '@/decorators.js';
import { RedisKVCache } from '@/misc/cache.js';

@Injectable()
export class ChannelMutingService {
	public userMutingChannelsCache: RedisKVCache<Set<string>>;

	constructor(
		@Inject(DI.redis)
		private redisClient: Redis.Redis,
		@Inject(DI.redisForSub)
		private redisForSub: Redis.Redis,
		@Inject(DI.channelMutingRepository)
		private channelMutingRepository: ChannelMutingRepository,
		private idService: IdService,
		private globalEventService: GlobalEventService,
	) {
		this.userMutingChannelsCache = new RedisKVCache<Set<string>>(this.redisClient, 'channelMutingChannels', {
			lifetime: 1000 * 60 * 30, // 30m
			memoryCacheLifetime: 1000 * 60, // 1m
			fetcher: (userId) => this.channelMutingRepository.find({
				where: { userId: userId },
				select: ['channelId'],
			}).then(xs => new Set(xs.map(x => x.channelId))),
			toRedisConverter: (value) => JSON.stringify(Array.from(value)),
			fromRedisConverter: (value) => new Set(JSON.parse(value)),
		});

		this.redisForSub.on('message', this.onMessage);
	}

	@bindThis
	public async mute(params: {
		requestUserId: MiUser['id'],
		targetChannelId: MiChannel['id'],
		expiresAt?: Date | null,
	}): Promise<void> {
		await this.channelMutingRepository.insert({
			id: this.idService.gen(),
			userId: params.requestUserId,
			channelId: params.targetChannelId,
			expiresAt: params.expiresAt,
		});

		this.globalEventService.publishInternalEvent('muteChannel', {
			userId: params.requestUserId,
			channelId: params.targetChannelId,
		});
	}

	@bindThis
	public async unmute(params: {
		requestUserId: MiUser['id'],
		targetChannelId: MiChannel['id'],
	}): Promise<void> {
		await this.channelMutingRepository.delete({
			userId: params.requestUserId,
			channelId: params.targetChannelId,
		});

		this.globalEventService.publishInternalEvent('unmuteChannel', {
			userId: params.requestUserId,
			channelId: params.targetChannelId,
		});
	}

	@bindThis
	private async onMessage(_: string, data: string): Promise<void> {
		const obj = JSON.parse(data);

		if (obj.channel === 'internal') {
			const { type, body } = obj.message as GlobalEvents['internal']['payload'];
			switch (type) {
				case 'muteChannel': {
					this.userMutingChannelsCache.refresh(body.userId).then();
					break;
				}
				case 'unmuteChannel': {
					this.userMutingChannelsCache.delete(body.userId).then();
					break;
				}
			}
		}
	}

	@bindThis
	public dispose(): void {
		this.userMutingChannelsCache.dispose();
	}

	@bindThis
	public onApplicationShutdown(signal?: string | undefined): void {
		this.dispose();
	}
}
