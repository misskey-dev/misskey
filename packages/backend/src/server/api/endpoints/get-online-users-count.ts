/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { MoreThan, In } from 'typeorm';
import { USER_ONLINE_THRESHOLD } from '@/const.js';
import type { UsersRepository, MutingsRepository, UserListMembershipsRepository } from '@/models/_.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import { UserFollowingService } from '@/core/UserFollowingService.js';
import { RoleService } from '@/core/RoleService.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { AvatarDecorationService } from '@/core/AvatarDecorationService.js';

export const meta = {
	tags: ['meta'],
	requireCredential: false,
	allowGet: true,
	cacheSec: 60 * 1,
	kind: 'read:account',
	res: {
		type: 'object',
		optional: false, nullable: false,
		properties: {
			count: {
				type: 'number',
				optional: false, nullable: false,
			},
			details: {
				type: 'array',
				optional: false, nullable: false,
				items: {
					type: 'object',
					optional: false, nullable: false,
					properties: {
						id: {
							type: 'string',
							optional: false, nullable: false,
						},
						username: {
							type: 'string',
							optional: false, nullable: false,
						},
						name: {
							type: 'string',
							optional: true, nullable: true,
						},
						avatarUrl: {
							type: 'string',
							optional: true, nullable: true,
						},
						avatarBlurhash: {
							type: 'string',
							optional: true, nullable: true,
						},
						avatarDecorations: {
							type: 'array',
							nullable: false, optional: false,
							items: {
								type: 'object',
								nullable: false, optional: false,
								properties: {
									id: {
										type: 'string',
										nullable: false, optional: false,
										format: 'id',
									},
									angle: {
										type: 'number',
										nullable: false, optional: true,
									},
									flipH: {
										type: 'boolean',
										nullable: false, optional: true,
									},
									url: {
										type: 'string',
										format: 'url',
										nullable: false, optional: false,
									},
									offsetX: {
										type: 'number',
										nullable: false, optional: true,
									},
									offsetY: {
										type: 'number',
										nullable: false, optional: true,
									},
								},
							},
						},
						host: {
							type: 'string',
							optional: true, nullable: true,
						},
						lastActiveDate: {
							type: 'string',
							optional: false, nullable: false,
						},
						onlineStatus: {
							type: 'string',
							enum: ['online', 'active', 'offline', 'unknown'],
							optional: false, nullable: false,
						},
						hideOnlineStatus: {
							type: 'boolean',
							optional: false, nullable: false,
						},
					},
				},
			},
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {},
	required: [],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.mutingsRepository)
		private mutingsRepository: MutingsRepository,

		@Inject(DI.userListMembershipsRepository)
		private userListMembershipsRepository: UserListMembershipsRepository,

		private userFollowingService: UserFollowingService,
		private roleService: RoleService,
		private userEntityService: UserEntityService,

		// 以下を追加
		private avatarDecorationService: AvatarDecorationService,
	) {
		super(meta, paramDef, async (ps, me) => {
			// オンラインユーザー総数の取得
			const count = await this.usersRepository.countBy({
				lastActiveDate: MoreThan(new Date(Date.now() - USER_ONLINE_THRESHOLD)),
			});

			// 未認証ユーザーの場合は数のみを返す
			if (me == null) {
				return {
					count,
					details: [], // 詳細情報は空配列を返す
				};
			}

			// ミュートしているユーザーのIDリストを取得
			const mutingIds = await this.mutingsRepository.find({
				where: {
					muterId: me.id,
				},
				select: ['muteeId'],
			}).then(mutings => mutings.map(m => m.muteeId));

			// 最近アクティブなすべてのユーザーを取得
			const activeUsers = await this.usersRepository.find({
				where: {
					lastActiveDate: MoreThan(new Date(Date.now() - USER_ONLINE_THRESHOLD)),
				},
				select: ['id', 'activeStatusVisibility'],
			});

			// 表示すべきユーザーIDのリストを作成
			let visibleUserIds: string[] = [];

			// 管理者の場合は全ユーザーを表示（ミュートしているユーザーを除く）
			if (me && await this.roleService.isAdministrator(me)) {
				visibleUserIds = activeUsers
					.map(user => user.id)
					.filter(id => !mutingIds.includes(id));
			} else {
				// 通常のユーザーの場合は各ユーザーの公開設定に従って判断
				for (const user of activeUsers) {
					// 旧システムからの移行期間の互換性処理を削除し、常にactiveStatusVisibilityを使用
					const visibility = user.activeStatusVisibility || { type: 'never' };

					// 自分自身、ミュート、非公開設定のチェック
					if (user.id === me.id) {
						visibleUserIds.push(user.id);
						continue;
					}
					if (visibility.type === 'never' || mutingIds.includes(user.id)) continue;

					// 各可視性タイプに応じた処理
					if (visibility.type === 'all') {
						visibleUserIds.push(user.id);
					} else if (visibility.type === 'following') {
						const isFollowing = await this.userFollowingService.isFollowing(user.id, me.id);
						if (isFollowing) visibleUserIds.push(user.id);
					} else if (visibility.type === 'followers') {
						const isFollower = await this.userFollowingService.isFollowing(me.id, user.id);
						if (isFollower) visibleUserIds.push(user.id);
					} else if (visibility.type === 'mutualFollow') {
						const isMutual = await this.userFollowingService.isMutual(me.id, user.id);
						if (isMutual) visibleUserIds.push(user.id);
					} else if (visibility.type === 'followingOrFollower') {
						const [isFollowing, isFollower] = await Promise.all([
							this.userFollowingService.isFollowing(me.id, user.id),
							this.userFollowingService.isFollowing(user.id, me.id),
						]);
						if (isFollowing || isFollower) visibleUserIds.push(user.id);
					} else if (visibility.type === 'list' && visibility.userListId) {
						// userが選択したリストのメンバーにmeが含まれているかチェック
						const membership = await this.userListMembershipsRepository.findOneBy({
							userListId: visibility.userListId,
							userId: me.id,
						});

						if (membership) visibleUserIds.push(user.id);
					}
				}
			}

			// ユーザーデータ取得時にhideOnlineStatusも取得する
			const usersData = await this.usersRepository.find({
				select: {
					id: true,
					username: true,
					name: true,
					avatarUrl: true,
					avatarBlurhash: true,
					avatarDecorations: true,
					host: true,
					lastActiveDate: true,
					hideOnlineStatus: true, // この行を追加
				},
				where: {
					id: In(visibleUserIds.length > 0 ? visibleUserIds : ['']),
					lastActiveDate: MoreThan(new Date(Date.now() - USER_ONLINE_THRESHOLD)),
				},
				order: {
					lastActiveDate: 'DESC',
				},
			});

			// オンラインステータスの判定ロジック
			function determineOnlineStatus(user: { lastActiveDate: Date | null, hideOnlineStatus: boolean }): 'online' | 'active' | 'offline' | 'unknown' {
				// オンラインステータスを非表示に設定している場合は常に unknown を返す
				if (user.hideOnlineStatus) return 'unknown';

				if (!user.lastActiveDate) return 'unknown';

				const now = Date.now();
				const elapsed = now - user.lastActiveDate.getTime();

				if (elapsed < 5 * 60 * 1000) { // 5分以内
					return 'online';
				} else if (elapsed < 30 * 60 * 1000) { // 30分以内
					return 'active';
				} else if (elapsed < USER_ONLINE_THRESHOLD) { // 閾値以内
					return 'offline';
				} else {
					return 'unknown';
				}
			}

			// すべてのアバターデコレーションを取得
			const allDecorations = await this.avatarDecorationService.getAll();
			const decorationMap = new Map(allDecorations.map(d => [d.id, d]));

			// lastActiveDateをISOString形式に変換
			const details = usersData.map(user => {
				return {
					...user,
					avatarUrl: user.avatarUrl ?? this.userEntityService.getIdenticonUrl(user),
					avatarDecorations: user.avatarDecorations.map(d => {
						const decoration = decorationMap.get(d.id);
						return {
							...d,
							url: decoration?.url, // URL を追加
						};
					}),
					lastActiveDate: user.lastActiveDate?.toISOString() ?? new Date().toISOString(),
					onlineStatus: determineOnlineStatus(user),
					hideOnlineStatus: user.hideOnlineStatus,
				};
			});

			return {
				count,
				details,
			};
		});
	}
}
