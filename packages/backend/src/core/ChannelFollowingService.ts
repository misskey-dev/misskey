import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type { ChannelFollowingsRepository } from '@/models/_.js';
import { MiChannel } from '@/models/_.js';
import { IdService } from '@/core/IdService.js';
import { CacheService } from '@/core/CacheService.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import { bindThis } from '@/decorators.js';
import type { MiLocalUser } from '@/models/User.js';

@Injectable()
export class ChannelFollowingService implements OnModuleInit {
	constructor(
		@Inject(DI.channelFollowingsRepository)
		private channelFollowingsRepository: ChannelFollowingsRepository,
		private idService: IdService,
		private cacheService: CacheService,
		private globalEventService: GlobalEventService,
	) {
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

		this.cacheService.userFollowingsCache.refresh(requestUser.id);

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

		this.cacheService.userFollowingsCache.refresh(requestUser.id);

		this.globalEventService.publishInternalEvent('unfollowChannel', {
			userId: requestUser.id,
			channelId: targetChannel.id,
		});
	}
}
