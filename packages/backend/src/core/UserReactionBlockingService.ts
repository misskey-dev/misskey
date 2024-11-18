/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { IdService } from '@/core/IdService.js';
import type { MiUser } from '@/models/User.js';
import type { MiBlocking } from '@/models/Blocking.js';
import { QueueService } from '@/core/QueueService.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import { DI } from '@/di-symbols.js';
import type { BlockingsRepository, UserListsRepository } from '@/models/_.js';
import Logger from '@/logger.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { ApRendererService } from '@/core/activitypub/ApRendererService.js';
import { LoggerService } from '@/core/LoggerService.js';
import { UserWebhookService } from '@/core/UserWebhookService.js';
import { bindThis } from '@/decorators.js';
import { CacheService } from '@/core/CacheService.js';
import { UserFollowingService } from '@/core/UserFollowingService.js';
import {MiBlockingType} from "@/models/Blocking.js";
import {UserBlockingService} from "@/core/UserBlockingService.js";

@Injectable()
export class UserReactionBlockingService {
	private logger: Logger;
	private userFollowingService: UserFollowingService;

	constructor(
		private moduleRef: ModuleRef,

		@Inject(DI.blockingsRepository)
		private blockingsRepository: BlockingsRepository,

		@Inject(DI.userListsRepository)
		private userListsRepository: UserListsRepository,

		private cacheService: CacheService,
		private userEntityService: UserEntityService,
		private userBlockingService: UserBlockingService,
		private idService: IdService,
		private queueService: QueueService,
		private globalEventService: GlobalEventService,
		private webhookService: UserWebhookService,
		private apRendererService: ApRendererService,
		private loggerService: LoggerService,
	) {
		this.logger = this.loggerService.getLogger('user-block');
	}

	@bindThis
	public async block(blocker: MiUser, blockee: MiUser, silent = false) {
		const blocking = await this.blockingsRepository.findOneBy({
			blockerId: blocker.id,
			blockeeId: blockee.id,
		}).then(blocking => {
			if (blocking) {
				return blocking;
			}
			return {
				id: this.idService.gen(),
				blocker,
				blockerId: blocker.id,
				blockee,
				blockeeId: blockee.id,
				blockType: MiBlockingType.Reaction,
			} as MiBlocking;
		});

		if (blocking.blockType === MiBlockingType.User) {
			await this.userBlockingService.unblock(blocker, blockee);
		}
		blocking.blockType = MiBlockingType.Reaction;
		await this.blockingsRepository.insert(blocking);

		this.cacheService.userReactionBlockingCache.refresh(blocker.id);
		this.cacheService.userReactionBlockedCache.refresh(blockee.id);

		this.globalEventService.publishInternalEvent('blockingReactionCreated', {
			blockerId: blocker.id,
			blockeeId: blockee.id,
		});
	}

	@bindThis
	public async unblock(blocker: MiUser, blockee: MiUser) {
		const blocking = await this.blockingsRepository.findOneBy({
			blockerId: blocker.id,
			blockeeId: blockee.id,
			blockType: MiBlockingType.Reaction,
		});

		if (blocking == null) {
			this.logger.warn('Unblock requested, but the target was not blocked.');
			return;
		}

		// Since we already have the blocker and blockee, we do not need to fetch
		// them in the query above and can just manually insert them here.
		blocking.blocker = blocker;
		blocking.blockee = blockee;

		await this.blockingsRepository.delete(blocking.id);

		this.cacheService.userReactionBlockingCache.refresh(blocker.id);
		this.cacheService.userReactionBlockedCache.refresh(blockee.id);

		this.globalEventService.publishInternalEvent('blockingReactionDeleted', {
			blockerId: blocker.id,
			blockeeId: blockee.id,
		});
	}

	@bindThis
	public async checkBlocked(blockerId: MiUser['id'], blockeeId: MiUser['id']): Promise<boolean> {
		return (await this.cacheService.userReactionBlockingCache.fetch(blockerId)).has(blockeeId);
	}
}
