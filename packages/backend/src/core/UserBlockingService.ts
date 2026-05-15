/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import type { MiUser } from '@/models/User.js';
import { QueueService } from '@/core/QueueService.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import { DI } from '@/di-symbols.js';
import type { FollowRequestsRepository, UserListsRepository, UserListMembershipsRepository } from '@/models/_.js';
import Logger from '@/logger.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { ApRendererService } from '@/core/activitypub/ApRendererService.js';
import { LoggerService } from '@/core/LoggerService.js';
import { UserWebhookService } from '@/core/UserWebhookService.js';
import { bindThis } from '@/decorators.js';
import { BlockingDataAccessService } from '@/core/data-access/BlockingDataAccessService.js';
import { UserFollowingService } from '@/core/UserFollowingService.js';

@Injectable()
export class UserBlockingService {
	private logger: Logger;

	constructor(
		@Inject(DI.followRequestsRepository)
		private followRequestsRepository: FollowRequestsRepository,

		@Inject(DI.userListsRepository)
		private userListsRepository: UserListsRepository,

		@Inject(DI.userListMembershipsRepository)
		private userListMembershipsRepository: UserListMembershipsRepository,

		private blockingDataAccessService: BlockingDataAccessService,
		private userEntityService: UserEntityService,
		private queueService: QueueService,
		private globalEventService: GlobalEventService,
		private webhookService: UserWebhookService,
		private apRendererService: ApRendererService,
		private loggerService: LoggerService,
		private userFollowingService: UserFollowingService,
	) {
		this.logger = this.loggerService.getLogger('user-block');
	}

	@bindThis
	public async block(blocker: MiUser, blockee: MiUser, silent = false) {
		await Promise.all([
			this.cancelRequest(blocker, blockee, silent),
			this.cancelRequest(blockee, blocker, silent),
			this.userFollowingService.unfollow(blocker, blockee, silent),
			this.userFollowingService.unfollow(blockee, blocker, silent),
			this.removeFromList(blockee, blocker),
		]);

		const blocking = await this.blockingDataAccessService.createBlocking({
			blockerId: blocker.id,
			blockeeId: blockee.id,
		});

		// AP renderer に渡すため relation を補完
		blocking.blocker = blocker;
		blocking.blockee = blockee;

		if (this.userEntityService.isLocalUser(blocker) && this.userEntityService.isRemoteUser(blockee)) {
			const content = this.apRendererService.addContext(this.apRendererService.renderBlock(blocking));
			this.queueService.deliver(blocker, content, blockee.inbox, false);
		}
	}

	@bindThis
	private async cancelRequest(follower: MiUser, followee: MiUser, silent = false) {
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
				schema: 'MeDetailed',
			}).then(packed => this.globalEventService.publishMainStream(followee.id, 'meUpdated', packed));
		}

		if (this.userEntityService.isLocalUser(follower) && !silent) {
			this.userEntityService.pack(followee, follower, {
				schema: 'UserDetailedNotMe',
			}).then(async packed => {
				this.globalEventService.publishMainStream(follower.id, 'unfollow', packed);
				this.webhookService.enqueueUserWebhook(follower.id, 'unfollow', { user: packed });
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
	private async removeFromList(listOwner: MiUser, user: MiUser) {
		const userLists = await this.userListsRepository.findBy({
			userId: listOwner.id,
		});

		for (const userList of userLists) {
			await this.userListMembershipsRepository.delete({
				userListId: userList.id,
				userId: user.id,
			});
		}
	}

	@bindThis
	public async unblock(blocker: MiUser, blockee: MiUser) {
		const blocking = await this.blockingDataAccessService.findBlocking(blocker.id, blockee.id);

		if (blocking == null) {
			this.logger.warn('ブロック解除がリクエストされましたがブロックしていませんでした');
			return;
		}

		// Since we already have the blocker and blockee, we do not need to fetch
		// them in the query above and can just manually insert them here.
		blocking.blocker = blocker;
		blocking.blockee = blockee;

		await this.blockingDataAccessService.deleteBlocking(blocking.id, blocker.id, blockee.id);

		// deliver if remote bloking
		if (this.userEntityService.isLocalUser(blocker) && this.userEntityService.isRemoteUser(blockee)) {
			const content = this.apRendererService.addContext(this.apRendererService.renderUndo(this.apRendererService.renderBlock(blocking), blocker));
			this.queueService.deliver(blocker, content, blockee.inbox, false);
		}
	}

	// TODO: 呼び出し側 (PollService / ReactionService / notes/polls/vote.ts /
	// ChatService / NoteCreateService 等) を BlockingDataAccessService.isBlocking に
	// 直接置換し、このラッパを削除する
	@bindThis
	public checkBlocked(blockerId: MiUser['id'], blockeeId: MiUser['id']): Promise<boolean> {
		return this.blockingDataAccessService.isBlocking(blockerId, blockeeId);
	}
}
