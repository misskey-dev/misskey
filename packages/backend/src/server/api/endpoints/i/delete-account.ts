/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import bcrypt from 'bcryptjs';
import { Inject, Injectable } from '@nestjs/common';
import type {
	UsersRepository,
	UserProfilesRepository,
	FollowingsRepository,
	MiUser,
} from '@/models/_.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DeleteAccountService } from '@/core/DeleteAccountService.js';
import { DI } from '@/di-symbols.js';
import { UserAuthService } from '@/core/UserAuthService.js';
import { RoleService } from '@/core/RoleService.js';
import { bindThis } from '@/decorators.js';
import { UserFollowingService } from '@/core/UserFollowingService.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import { NotificationService } from '@/core/NotificationService.js';

export const meta = {
	requireCredential: true,

	secure: true,
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		password: { type: 'string' },
		token: { type: 'string', nullable: true },
	},
	required: ['password'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.userProfilesRepository)
		private userProfilesRepository: UserProfilesRepository,

		@Inject(DI.followingsRepository)
		private followingsRepository: FollowingsRepository,

		private roleService: RoleService,
		private deleteAccountService: DeleteAccountService,
		private userFollowingService: UserFollowingService,
		private globalEventService: GlobalEventService,
		private notificationService: NotificationService,
		private userAuthService: UserAuthService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const token = ps.token;
			const profile = await this.userProfilesRepository.findOneByOrFail({ userId: me.id });

			if (profile.twoFactorEnabled) {
				if (token == null) {
					throw new Error('authentication failed');
				}

				try {
					await this.userAuthService.twoFactorAuthenticate(profile, token);
				} catch (_) {
					throw new Error('authentication failed');
				}
			}

			const userDetailed = await this.usersRepository.findOneByOrFail({ id: me.id });
			if (userDetailed.isDeleted) {
				return;
			}

			const passwordMatched = await bcrypt.compare(ps.password, profile.password!);
			if (!passwordMatched) {
				throw new Error('incorrect password');
			}

			// ロールポリシーの取得
			const policies = await this.roleService.getUserPolicies(me.id);
			const canPublicNote = policies.canPublicNote;

			// ローカルへの投稿が禁止されている場合、削除時に凍結を行う
			if (!canPublicNote) {
				await this.userProfilesRepository.update({ userId: me.id }, {
					suspendedReason: 'Account deleted',
				});

				await this.usersRepository.update(me.id, {
					isSuspended: true,
				});

				// 内部イベントを発行（凍結状態の変更を通知）
				this.globalEventService.publishInternalEvent('userChangeSuspendedState', {
					id: me.id,
					isSuspended: true,
				});

				// 通知を全て既読にする
				await this.notificationService.readAllNotification(me.id).catch(e => {
				});

				// フォローを全て解除
				await this.unFollowAll(me).catch(e => {
				});

				return;
			}

			await this.deleteAccountService.deleteAccount(me);
		});
	}

	/**
	 * フォローしているユーザーを全てアンフォローする
	 */
	@bindThis
	private async unFollowAll(follower: MiUser) {
		const followings = await this.followingsRepository.findBy({
			followerId: follower.id,
		});

		for (const following of followings) {
			const followee = await this.usersRepository.findOneBy({
				id: following.followeeId,
			});

			if (followee == null) {
				throw new Error(`Cant find followee ${following.followeeId}`);
			}

			await this.userFollowingService.unfollow(follower, followee, true);
		}
	}
}
