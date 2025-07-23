/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import type { FollowingsRepository, FollowRequestsRepository, UsersRepository } from '@/models/_.js';
import type { MiRemoteUser, MiUser } from '@/models/User.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import { DI } from '@/di-symbols.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { bindThis } from '@/decorators.js';
import { ModerationLogService } from '@/core/ModerationLogService.js';
import { AccountUpdateService } from '@/core/AccountUpdateService.js';

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
		private accountUpdateService: AccountUpdateService,
		private moderationLogService: ModerationLogService,
	) {
	}

	@bindThis
	public async suspend(user: MiUser, moderator: MiUser): Promise<void> {
		await this.usersRepository.update(user.id, {
			isSuspended: true,
		});

		this.moderationLogService.log(moderator, 'suspend', {
			userId: user.id,
			userUsername: user.username,
			userHost: user.host,
		});

		(async () => {
			await this.postSuspend(user, false).catch((e: any) => { });
			await this.suspendFollowings(user).catch((e: any) => { });
		})();
	}

	@bindThis
	public async suspendFromRemote(user: { id: MiRemoteUser['id']; host: MiRemoteUser['host'] }): Promise<void> {
		await this.usersRepository.update(user.id, {
			isRemoteSuspended: true,
		});

		this.postSuspend(user, true);
	}

	@bindThis
	public async unsuspend(user: MiUser, moderator: MiUser): Promise<void> {
		await this.usersRepository.update(user.id, {
			isSuspended: false,
		});

		this.moderationLogService.log(moderator, 'unsuspend', {
			userId: user.id,
			userUsername: user.username,
			userHost: user.host,
		});

		(async () => {
			await this.postUnsuspend(user, false).catch((e: any) => { });
			await this.restoreFollowings(user).catch((e: any) => { console.error(e); });
		})();
	}

	@bindThis
	public async unsuspendFromRemote(user: { id: MiRemoteUser['id']; host: MiRemoteUser['host'] }): Promise<void> {
		await this.usersRepository.update(user.id, {
			isRemoteSuspended: false,
		});

		this.postUnsuspend(user, true);
	}

	@bindThis
	private async postSuspend(user: { id: MiUser['id']; host: MiUser['host'] }, isFromRemote: boolean): Promise<void> {
		this.globalEventService.publishInternalEvent(
			'userChangeSuspendedState',
			isFromRemote ? { id: user.id, isRemoteSuspended: true } : { id: user.id, isSuspended: true }
		);

		this.followRequestsRepository.delete({
			followeeId: user.id,
		});
		this.followRequestsRepository.delete({
			followerId: user.id,
		});

		if (this.userEntityService.isLocalUser(user)) {
			this.accountUpdateService.publishToFollowersAndSharedInboxAndRelays(user.id);
		}
	}

	@bindThis
	private async postUnsuspend(user: { id: MiUser['id']; host: MiUser['host'] }, isFromRemote: boolean): Promise<void> {
		this.globalEventService.publishInternalEvent(
			'userChangeSuspendedState',
			isFromRemote ? { id: user.id, isRemoteSuspended: false } : { id: user.id, isSuspended: false }
		);

		if (this.userEntityService.isLocalUser(user)) {
			this.accountUpdateService.publishToFollowersAndSharedInboxAndRelays(user.id);
		}
	}

	@bindThis
	private async suspendFollowings(follower: { id: MiUser['id'] }) {
		await this.followingsRepository.update(
			{
				followerId: follower.id,
			},
			{
				isFollowerSuspended: true,
			}
		);
	}

	@bindThis
	private async restoreFollowings(_follower: { id: MiUser['id'] }) {
		// 最新の情報を取得
		const follower = await this.usersRepository.findOneBy({ id: _follower.id });
		if (follower == null) {
			// ユーザーが削除されている場合は何もしないでおく
			return;
		}
		if (this.userEntityService.isSuspendedEither(follower)) {
			// フォロー関係を復元しない
			return;
		}

		// フォロー関係を復元（isFollowerSuspended: false）に変更
		await this.followingsRepository.update(
			{
				followerId: follower.id,
			},
			{
				isFollowerSuspended: false,
			}
		);
	}
}
