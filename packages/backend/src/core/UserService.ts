/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import type { FollowingsRepository, UsersRepository, UserProfilesRepository } from '@/models/_.js';
import type { MiUser } from '@/models/User.js';
import { DI } from '@/di-symbols.js';
import { bindThis } from '@/decorators.js';
import { SystemWebhookService } from '@/core/SystemWebhookService.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';

@Injectable()
export class UserService {
	constructor(
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,
		@Inject(DI.followingsRepository)
		private followingsRepository: FollowingsRepository,
		@Inject(DI.userProfilesRepository)
		private userProfilesRepository: UserProfilesRepository,
		private systemWebhookService: SystemWebhookService,
		private userEntityService: UserEntityService,
	) {
	}

	@bindThis
	public async updateLastActiveDate(user: MiUser): Promise<void> {
		if (user.isHibernated) {
			const result = await this.usersRepository.createQueryBuilder().update()
				.set({
					lastActiveDate: new Date(),
				})
				.where('id = :id', { id: user.id })
				.returning('*')
				.execute()
				.then((response) => {
					return response.raw[0];
				});
			const wokeUp = result.isHibernated;
			if (wokeUp) {
				this.usersRepository.update(user.id, {
					isHibernated: false,
				});
				this.followingsRepository.update({
					followerId: user.id,
				}, {
					isFollowerHibernated: false,
				});
			}
		} else {
			this.usersRepository.update(user.id, {
				lastActiveDate: new Date(),
			});
		}
	}

	/**
	 * SystemWebhookを用いてユーザに関する操作内容を管理者各位に通知する.
	 * ここではJobQueueへのエンキューのみを行うため、即時実行されない.
	 *
	 * @see SystemWebhookService.enqueueSystemWebhook
	 */
	@bindThis
	public async notifySystemWebhook(user: MiUser, type: 'userCreated') {
		const packedUser = await this.userEntityService.pack(user, null, { schema: 'UserLite' });
		return this.systemWebhookService.enqueueSystemWebhook(type, packedUser);
	}

	@bindThis
	public async createUser(params): Promise<void> {
		await this.userProfilesRepository.insert({
			userId: params.userId,
			notificationRecieveConfig: {
				note: { type: 'all' },
				follow: { type: 'all' },
				mention: { type: 'all' },
				reply: { type: 'all' },
				renote: { type: 'all' },
				quote: { type: 'all' },
				reaction: { type: 'all' },
				// デフォルトで「なし」にする特殊な通知
				unfollow: { type: 'never' },
				blocked: { type: 'never' },
				unblocked: { type: 'never' },
			},
			// 他のプロパティ...
		});
	}
}
