/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { MoreThan, In } from 'typeorm';
import { Inject, Injectable } from '@nestjs/common';
import { USER_ONLINE_THRESHOLD } from '@/const.js';
import type { UsersRepository, MutingsRepository } from '@/models/_.js';
import type { MiUser } from '@/models/User.js'; // MiUser型をインポート
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import { UserFollowingService } from '@/core/UserFollowingService.js';
import { UserMutingService } from '@/core/UserMutingService.js';

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
						host: {
							type: 'string',
							optional: true, nullable: true,
						},
						lastActiveDate: {
							type: 'string',
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

		private userFollowingService: UserFollowingService,
		private userMutingService: UserMutingService,
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

			// 最近アクティブなすべてのユーザーを取得（showActiveStatusを含む）
			const activeUsers = await this.usersRepository.find({
				where: {
					lastActiveDate: MoreThan(new Date(Date.now() - USER_ONLINE_THRESHOLD)),
					showActiveStatus: true, // showActiveStatus=trueのユーザーのみ
				},
				select: ['id', 'showActiveStatus'],
			});

			// アクティブかつshowActiveStatus=trueのユーザーのIDのみの配列（ミュートしているユーザーを除外）
			const activeUserIds = activeUsers
				.map(user => user.id)
				.filter(id => !mutingIds.includes(id));

			// 1. 相互フォロー関係のユーザーIDを抽出 (showActiveStatus=trueのユーザーのみ)
			const mutualFollowingIds: string[] = [];

			for (const userId of activeUserIds) {
				if (userId === me.id) continue; // 自分自身は除外（後で別条件で追加）

				// UserFollowingServiceを使って相互フォロー関係をチェック
				const isMutual = await this.userFollowingService.isMutual(me.id, userId);
				if (isMutual) {
					mutualFollowingIds.push(userId);
				}
			}

			// 2. 自分のshowActiveStatusをチェック
			const myUser = await this.usersRepository.findOneBy({
				id: me.id,
			});

			// 3. 表示すべきユーザーIDのリストを作成
			const visibleUserIds = [...mutualFollowingIds]; // 相互フォロワーかつshowActiveStatus=trueのユーザー

			// 自分自身のshowActiveStatusが有効なら自分も追加
			if (myUser?.showActiveStatus === true) {
				visibleUserIds.push(me.id);
			}

			// 4. 詳細情報を取得 (lastActiveDateを文字列に変換)
			const usersData = await this.usersRepository.find({
				select: {
					id: true,
					username: true,
					name: true,
					avatarUrl: true,
					avatarBlurhash: true,
					host: true,
					lastActiveDate: true,
				},
				where: {
					id: In(visibleUserIds.length > 0 ? visibleUserIds : ['']), // 空配列回避
					lastActiveDate: MoreThan(new Date(Date.now() - USER_ONLINE_THRESHOLD)),
				},
				order: {
					lastActiveDate: 'DESC',
				},
			});

			// userパラメータに型を指定
			const details = usersData.map((user: Pick<MiUser, 'id' | 'username' | 'name' | 'avatarUrl' | 'avatarBlurhash' | 'host' | 'lastActiveDate'>) => ({
				...user,
				lastActiveDate: user.lastActiveDate?.toISOString() ?? new Date().toISOString(),
			}));

			return {
				count,
				details,
			};
		});
	}
}
