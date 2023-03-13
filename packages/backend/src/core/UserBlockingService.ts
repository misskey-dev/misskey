
import { Inject, Injectable, OnApplicationShutdown } from '@nestjs/common';
import Redis from 'ioredis';
import { IdService } from '@/core/IdService.js';
import type { User } from '@/models/entities/User.js';
import type { Blocking } from '@/models/entities/Blocking.js';
import { QueueService } from '@/core/QueueService.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import PerUserFollowingChart from '@/core/chart/charts/per-user-following.js';
import { DI } from '@/di-symbols.js';
import type { UsersRepository, FollowingsRepository, FollowRequestsRepository, BlockingsRepository, UserListsRepository, UserListJoiningsRepository } from '@/models/index.js';
import Logger from '@/logger.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { ApRendererService } from '@/core/activitypub/ApRendererService.js';
import { LoggerService } from '@/core/LoggerService.js';
import { WebhookService } from '@/core/WebhookService.js';
import { bindThis } from '@/decorators.js';
import { Cache } from '@/misc/cache.js';
import { StreamMessages } from '@/server/api/stream/types.js';

@Injectable()
export class UserBlockingService implements OnApplicationShutdown {
	private logger: Logger;

	// キーがユーザーIDで、値がそのユーザーがブロックしているユーザーのIDのリストなキャッシュ
	private blockingsByUserIdCache: Cache<User['id'][]>;

	constructor(
		@Inject(DI.redisSubscriber)
		private redisSubscriber: Redis.Redis,

		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.followingsRepository)
		private followingsRepository: FollowingsRepository,

		@Inject(DI.followRequestsRepository)
		private followRequestsRepository: FollowRequestsRepository,

		@Inject(DI.blockingsRepository)
		private blockingsRepository: BlockingsRepository,

		@Inject(DI.userListsRepository)
		private userListsRepository: UserListsRepository,

		@Inject(DI.userListJoiningsRepository)
		private userListJoiningsRepository: UserListJoiningsRepository,

		private userEntityService: UserEntityService,
		private idService: IdService,
		private queueService: QueueService,
		private globalEventService: GlobalEventService,
		private webhookService: WebhookService,
		private apRendererService: ApRendererService,
		private perUserFollowingChart: PerUserFollowingChart,
		private loggerService: LoggerService,
	) {
		this.logger = this.loggerService.getLogger('user-block');

		this.blockingsByUserIdCache = new Cache<User['id'][]>(Infinity);

		this.redisSubscriber.on('message', this.onMessage);
	}

	@bindThis
	private async onMessage(_: string, data: string): Promise<void> {
		const obj = JSON.parse(data);

		if (obj.channel === 'internal') {
			const { type, body } = obj.message as StreamMessages['internal']['payload'];
			switch (type) {
				case 'blockingCreated': {
					const cached = this.blockingsByUserIdCache.get(body.blockerId);
					if (cached) {
						this.blockingsByUserIdCache.set(body.blockerId, [...cached, ...[body.blockeeId]]);
					}
					break;
				}
				case 'blockingDeleted': {
					const cached = this.blockingsByUserIdCache.get(body.blockerId);
					if (cached) {
						this.blockingsByUserIdCache.set(body.blockerId, cached.filter(x => x !== body.blockeeId));
					}
					break;
				}
				default:
					break;
			}
		}
	}

	@bindThis
	public async block(blocker: User, blockee: User) {
		await Promise.all([
			this.cancelRequest(blocker, blockee),
			this.cancelRequest(blockee, blocker),
			this.unFollow(blocker, blockee),
			this.unFollow(blockee, blocker),
			this.removeFromList(blockee, blocker),
		]);

		const blocking = {
			id: this.idService.genId(),
			createdAt: new Date(),
			blocker,
			blockerId: blocker.id,
			blockee,
			blockeeId: blockee.id,
		} as Blocking;

		await this.blockingsRepository.insert(blocking);

		this.globalEventService.publishInternalEvent('blockingCreated', {
			blockerId: blocker.id,
			blockeeId: blockee.id,
		});

		if (this.userEntityService.isLocalUser(blocker) && this.userEntityService.isRemoteUser(blockee)) {
			const content = this.apRendererService.addContext(this.apRendererService.renderBlock(blocking));
			this.queueService.deliver(blocker, content, blockee.inbox, false);
		}
	}

	@bindThis
	private async cancelRequest(follower: User, followee: User) {
		const request = await this.followRequestsRepository.findOneBy({
			followeeId: followee.id,
			followerId: follower.id,
		});

		if (request == null) {
			return;
		}

		await this.followRequestsRepository.delete({
			followeeId: followee.id,
			followerId: follower.id,
		});

		if (this.userEntityService.isLocalUser(followee)) {
			this.userEntityService.pack(followee, followee, {
				detail: true,
			}).then(packed => this.globalEventService.publishMainStream(followee.id, 'meUpdated', packed));
		}

		if (this.userEntityService.isLocalUser(follower)) {
			this.userEntityService.pack(followee, follower, {
				detail: true,
			}).then(async packed => {
				this.globalEventService.publishUserEvent(follower.id, 'unfollow', packed);
				this.globalEventService.publishMainStream(follower.id, 'unfollow', packed);

				const webhooks = (await this.webhookService.getActiveWebhooks()).filter(x => x.userId === follower.id && x.on.includes('unfollow'));
				for (const webhook of webhooks) {
					this.queueService.webhookDeliver(webhook, 'unfollow', {
						user: packed,
					});
				}
			});
		}

		// リモートにフォローリクエストをしていたらUndoFollow送信
		if (this.userEntityService.isLocalUser(follower) && this.userEntityService.isRemoteUser(followee)) {
			const content = this.apRendererService.addContext(this.apRendererService.renderUndo(this.apRendererService.renderFollow(follower, followee), follower));
			this.queueService.deliver(follower, content, followee.inbox, false);
		}

		// リモートからフォローリクエストを受けていたらReject送信
		if (this.userEntityService.isRemoteUser(follower) && this.userEntityService.isLocalUser(followee)) {
			const content = this.apRendererService.addContext(this.apRendererService.renderReject(this.apRendererService.renderFollow(follower, followee, request.requestId!), followee));
			this.queueService.deliver(followee, content, follower.inbox, false);
		}
	}

	@bindThis
	private async unFollow(follower: User, followee: User) {
		const following = await this.followingsRepository.findOneBy({
			followerId: follower.id,
			followeeId: followee.id,
		});

		if (following == null) {
			return;
		}

		await Promise.all([
			this.followingsRepository.delete(following.id),
			this.usersRepository.decrement({ id: follower.id }, 'followingCount', 1),
			this.usersRepository.decrement({ id: followee.id }, 'followersCount', 1),
			this.perUserFollowingChart.update(follower, followee, false),
		]);

		// Publish unfollow event
		if (this.userEntityService.isLocalUser(follower)) {
			this.userEntityService.pack(followee, follower, {
				detail: true,
			}).then(async packed => {
				this.globalEventService.publishUserEvent(follower.id, 'unfollow', packed);
				this.globalEventService.publishMainStream(follower.id, 'unfollow', packed);

				const webhooks = (await this.webhookService.getActiveWebhooks()).filter(x => x.userId === follower.id && x.on.includes('unfollow'));
				for (const webhook of webhooks) {
					this.queueService.webhookDeliver(webhook, 'unfollow', {
						user: packed,
					});
				}
			});
		}

		// リモートにフォローをしていたらUndoFollow送信
		if (this.userEntityService.isLocalUser(follower) && this.userEntityService.isRemoteUser(followee)) {
			const content = this.apRendererService.addContext(this.apRendererService.renderUndo(this.apRendererService.renderFollow(follower, followee), follower));
			this.queueService.deliver(follower, content, followee.inbox, false);
		}

		// リモートからフォローをされていたらRejectFollow送信
		if (this.userEntityService.isLocalUser(followee) && this.userEntityService.isRemoteUser(follower)) {
			const content = this.apRendererService.addContext(this.apRendererService.renderReject(this.apRendererService.renderFollow(follower, followee), followee));
			this.queueService.deliver(followee, content, follower.inbox, false);
		}
	}

	@bindThis
	private async removeFromList(listOwner: User, user: User) {
		const userLists = await this.userListsRepository.findBy({
			userId: listOwner.id,
		});

		for (const userList of userLists) {
			await this.userListJoiningsRepository.delete({
				userListId: userList.id,
				userId: user.id,
			});
		}
	}

	@bindThis
	public async unblock(blocker: User, blockee: User) {
		const blocking = await this.blockingsRepository.findOneBy({
			blockerId: blocker.id,
			blockeeId: blockee.id,
		});

		if (blocking == null) {
			this.logger.warn('ブロック解除がリクエストされましたがブロックしていませんでした');
			return;
		}

		// Since we already have the blocker and blockee, we do not need to fetch
		// them in the query above and can just manually insert them here.
		blocking.blocker = blocker;
		blocking.blockee = blockee;

		await this.blockingsRepository.delete(blocking.id);

		this.globalEventService.publishInternalEvent('blockingDeleted', {
			blockerId: blocker.id,
			blockeeId: blockee.id,
		});

		// deliver if remote bloking
		if (this.userEntityService.isLocalUser(blocker) && this.userEntityService.isRemoteUser(blockee)) {
			const content = this.apRendererService.addContext(this.apRendererService.renderUndo(this.apRendererService.renderBlock(blocking), blocker));
			this.queueService.deliver(blocker, content, blockee.inbox, false);
		}
	}

	@bindThis
	public async checkBlocked(blockerId: User['id'], blockeeId: User['id']): Promise<boolean> {
		const blockedUserIds = await this.blockingsByUserIdCache.fetch(blockerId, () => this.blockingsRepository.find({
			where: {
				blockerId,
			},
			select: ['blockeeId'],
		}).then(records => records.map(record => record.blockeeId)));
		return blockedUserIds.includes(blockeeId);
	}

	@bindThis
	public onApplicationShutdown(signal?: string | undefined) {
		this.redisSubscriber.off('message', this.onMessage);
	}
}
