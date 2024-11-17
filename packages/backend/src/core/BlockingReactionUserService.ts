/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { IdService } from '@/core/IdService.js';
import type { MiUser } from '@/models/User.js';
import { QueueService } from '@/core/QueueService.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import { DI } from '@/di-symbols.js';
import type {
	FollowRequestsRepository,
	BlockingsRepository,
	UserListsRepository,
	UserListMembershipsRepository,
	BlockingReactionUsersRepository
} from '@/models/_.js';
import Logger from '@/logger.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { ApRendererService } from '@/core/activitypub/ApRendererService.js';
import { LoggerService } from '@/core/LoggerService.js';
import { UserWebhookService } from '@/core/UserWebhookService.js';
import { bindThis } from '@/decorators.js';
import { CacheService } from '@/core/CacheService.js';
import {MiBlockingReactionUser} from "@/models/_.js";

@Injectable()
export class BlockingReactionUserService implements OnModuleInit {
	private logger: Logger;

	constructor(
		private moduleRef: ModuleRef,

		@Inject(DI.blockingReactionUsersRepository)
		private blockingReactionUsersRepository: BlockingReactionUsersRepository,

		private cacheService: CacheService,
		private userEntityService: UserEntityService,
		private idService: IdService,
		private queueService: QueueService,
		private globalEventService: GlobalEventService,
		private webhookService: UserWebhookService,
		private apRendererService: ApRendererService,
		private loggerService: LoggerService,
	) {
		this.logger = this.loggerService.getLogger('user-block');
	}

	onModuleInit() {
	}

	@bindThis
	public async block(blocker: MiUser, blockee: MiUser, silent = false) {
		await Promise.all([
		]);

		const blocking = {
			id: this.idService.gen(),
			blocker,
			blockerId: blocker.id,
			blockee,
			blockeeId: blockee.id,
		} as MiBlockingReactionUser;

		await this.blockingReactionUsersRepository.insert(blocking);

		this.cacheService.blockingReactionUserCache.refresh(blocker.id);
		this.cacheService.blockedReactionUserCache.refresh(blockee.id);

		this.globalEventService.publishInternalEvent('blockingReactionUserCreated', {
			blockerId: blocker.id,
			blockeeId: blockee.id,
		});
	}

	@bindThis
	public async unblock(blocker: MiUser, blockee: MiUser) {
		const blocking = await this.blockingReactionUsersRepository.findOneBy({
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

		await this.blockingReactionUsersRepository.delete(blocking.id);

		this.cacheService.blockingReactionUserCache.refresh(blocker.id);
		this.cacheService.blockedReactionUserCache.refresh(blockee.id);

		this.globalEventService.publishInternalEvent('blockingReactionUserDeleted', {
			blockerId: blocker.id,
			blockeeId: blockee.id,
		});
	}

	@bindThis
	public async checkBlocked(blockerId: MiUser['id'], blockeeId: MiUser['id']): Promise<boolean> {
		return (await this.cacheService.blockingReactionUserCache.fetch(blockerId)).has(blockeeId);
	}
}
