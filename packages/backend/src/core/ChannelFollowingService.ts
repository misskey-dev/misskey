import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';
import { DI } from '@/di-symbols.js';
import type { ChannelFollowingsRepository } from '@/models/_.js';
import { MiChannel } from '@/models/_.js';
import { IdService } from '@/core/IdService.js';
import { GlobalEvents, GlobalEventService } from '@/core/GlobalEventService.js';
import { bindThis } from '@/decorators.js';
import type { MiLocalUser } from '@/models/User.js';
import { RedisKVCache } from '@/misc/cache.js';

@Injectable()
export class ChannelFollowingService implements OnModuleInit {
	public userFollowingChannelsCache: RedisKVCache<Set<string>>;

	constructor(
		@Inject(DI.redis)
		private redisClient: Redis.Redis,
		@Inject(DI.redisForSub)
		private redisForSub: Redis.Redis,
		@Inject(DI.channelFollowingsRepository)
		private channelFollowingsRepository: ChannelFollowingsRepository,
		private idService: IdService,
		private globalEventService: GlobalEventService,
	) {
		this.userFollowingChannelsCache = new RedisKVCache<Set<string>>(this.redisClient, 'userFollowingChannels', {
			lifetime: 1000 * 60 * 30, // 30m
			memoryCacheLifetime: 1000 * 60, // 1m
			fetcher: (key) => this.channelFollowingsRepository.find({
				where: { followerId: key },
				select: ['followeeId'],
			}).then(xs => new Set(xs.map(x => x.followeeId))),
			toRedisConverter: (value) => JSON.stringify(Array.from(value)),
			fromRedisConverter: (value) => new Set(JSON.parse(value)),
		});

		this.redisForSub.on('message', this.onMessage);
	}

	onModuleInit() {
	}

	@bindThis
	public async follow(
		requestUser: MiLocalUser,
		targetChannel: MiChannel,
	): Promise<void> {
		await this.channelFollowingsRepository.insert({
			id: this.idService.gen(),
			followerId: requestUser.id,
			followeeId: targetChannel.id,
		});

		this.globalEventService.publishInternalEvent('followChannel', {
			userId: requestUser.id,
			channelId: targetChannel.id,
		});
	}

	@bindThis
	public async unfollow(
		requestUser: MiLocalUser,
		targetChannel: MiChannel,
	): Promise<void> {
		await this.channelFollowingsRepository.delete({
			followerId: requestUser.id,
			followeeId: targetChannel.id,
		});

		this.globalEventService.publishInternalEvent('unfollowChannel', {
			userId: requestUser.id,
			channelId: targetChannel.id,
		});
	}

	@bindThis
	private async onMessage(_: string, data: string): Promise<void> {
		const obj = JSON.parse(data);

		if (obj.channel === 'internal') {
			const { type, body } = obj.message as GlobalEvents['internal']['payload'];
			switch (type) {
				case 'followChannel': {
					this.userFollowingChannelsCache.refresh(body.userId);
					break;
				}
				case 'unfollowChannel': {
					this.userFollowingChannelsCache.delete(body.userId);
					break;
				}
			}
		}
	}

	@bindThis
	public dispose(): void {
		this.userFollowingChannelsCache.dispose();
	}

	@bindThis
	public onApplicationShutdown(signal?: string | undefined): void {
		this.dispose();
	}
}
