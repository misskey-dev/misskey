/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import type { FollowingsRepository, FollowRequestsRepository, UsersRepository } from '@/models/_.js';
import type { MiUser } from '@/models/User.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import { DI } from '@/di-symbols.js';
import { ApRendererService } from '@/core/activitypub/ApRendererService.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { bindThis } from '@/decorators.js';
import { ApDeliverManagerService } from './activitypub/ApDeliverManagerService.js';
import { ModerationLogService } from '@/core/ModerationLogService.js';

@Injectable()
export class UserSuspendService {
	constructor(
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.followingsRepository)
		private followingsRepository: FollowingsRepository,

		@Inject(DI.followRequestsRepository)
		private followRequestsRepository: FollowRequestsRepository,

		private userEntityService: UserEntityService,
		private globalEventService: GlobalEventService,
		private apRendererService: ApRendererService,
		private apDeliverManagerService: ApDeliverManagerService,
		private moderationLogService: ModerationLogService,
	) {
	}

	@bindThis
	public async suspend(user: MiUser, moderator: MiUser): Promise<void> {
		await this.updateSuspendedState(user.id, true);

		this.moderationLogService.log(moderator, 'suspend', {
			userId: user.id,
			userUsername: user.username,
			userHost: user.host,
		});

		(async () => {
			await this.postSuspend(user).catch(_ => {});
		})();
	}

	@bindThis
	public async unsuspend(user: MiUser, moderator: MiUser): Promise<void> {
		await this.updateSuspendedState(user.id, false);

		this.moderationLogService.log(moderator, 'unsuspend', {
			userId: user.id,
			userUsername: user.username,
			userHost: user.host,
		});

		(async () => {
			await this.postUnsuspend(user).catch(_ => {});
		})();
	}

	@bindThis
	private async postSuspend(user: { id: MiUser['id']; host: MiUser['host'] }): Promise<void> {
		this.globalEventService.publishInternalEvent('userChangeSuspendedState', { id: user.id, isSuspended: true });

		this.followRequestsRepository.delete({
			followeeId: user.id,
		});
		this.followRequestsRepository.delete({
			followerId: user.id,
		});

		if (this.userEntityService.isLocalUser(user)) {
			const content = this.apRendererService.addContext(this.apRendererService.renderDelete(this.userEntityService.genLocalUserUri(user.id), user));
			const manager = this.apDeliverManagerService.createDeliverManager(user, content);
			manager.addAllKnowingSharedInboxRecipe();
			manager.addFollowersRecipe();
			await manager.execute();
		}
	}

	@bindThis
	private async postUnsuspend(user: MiUser): Promise<void> {
		this.globalEventService.publishInternalEvent('userChangeSuspendedState', { id: user.id, isSuspended: false });

		if (this.userEntityService.isLocalUser(user)) {
			const content = this.apRendererService.addContext(this.apRendererService.renderUndo(this.apRendererService.renderDelete(this.userEntityService.genLocalUserUri(user.id), user), user));
			const manager = this.apDeliverManagerService.createDeliverManager(user, content);
			manager.addAllKnowingSharedInboxRecipe();
			manager.addFollowersRecipe();
			await manager.execute();
		}
	}

	@bindThis
	private async updateSuspendedState(userId: MiUser['id'], isSuspended: boolean): Promise<void> {
		await this.usersRepository.manager.transaction(async manager => {
			// The user row is also locked before inserting a following.
			await manager.getRepository(this.usersRepository.target).update(userId, { isSuspended });
			await manager.getRepository(this.followingsRepository.target).update(
				{ followerId: userId },
				{ isFollowerSuspended: isSuspended },
			);
		});
	}
}
