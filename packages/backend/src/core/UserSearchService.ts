/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Brackets, SelectQueryBuilder } from 'typeorm';
import { DI } from '@/di-symbols.js';
import { type FollowingsRepository, MiUser, type UsersRepository } from '@/models/_.js';
import { bindThis } from '@/decorators.js';
import { sqlLikeEscape } from '@/misc/sql-like-escape.js';
import type { Config } from '@/config.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { Packed } from '@/misc/json-schema.js';

function defaultActiveThreshold() {
	return new Date(Date.now() - 1000 * 60 * 60 * 24 * 30);
}

@Injectable()
export class UserSearchService {
	constructor(
		@Inject(DI.config)
		private config: Config,
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,
		@Inject(DI.followingsRepository)
		private followingsRepository: FollowingsRepository,
		private userEntityService: UserEntityService,
	) {
	}

	/**
	 * ユーザ名とホスト名によるユーザ検索を行う.
	 *
	 * - 検索結果には優先順位がつけられており、以下の順序で検索が行われる.
	 *   1. フォローしているユーザのうち、一定期間以内（※）に更新されたユーザ
	 *   2. フォローしているユーザのうち、一定期間以内に更新されていないユーザ
	 *   3. フォローしていないユーザのうち、一定期間以内に更新されたユーザ
	 *   4. フォローしていないユーザのうち、一定期間以内に更新されていないユーザ
	 * - ログインしていない場合は、以下の順序で検索が行われる.
	 *   1. 一定期間以内に更新されたユーザ
	 *   2. 一定期間以内に更新されていないユーザ
	 * - それぞれの検索結果はユーザ名の昇順でソートされる.
	 * - 動作的には先に登場した検索結果の登場位置が優先される(条件的にユーザIDが重複することはないが).
	 *   （1で既にヒットしていた場合、2, 3, 4でヒットしても無視される）
	 * - ユーザ名とホスト名の検索条件はそれぞれ前方一致で検索される.
	 * - ユーザ名の検索は大文字小文字を区別しない.
	 * - ホスト名の検索は大文字小文字を区別しない.
	 * - 検索結果は最大で {@link opts.limit} 件までとなる.
	 *
	 * ※一定期間とは {@link params.activeThreshold} で指定された日時から現在までの期間を指す.
	 *
	 * @param params 検索条件.
	 * @param opts 関数の動作を制御するオプション.
	 * @param me 検索を実行するユーザの情報. 未ログインの場合は指定しない.
	 * @see {@link UserSearchService#buildSearchUserQueries}
	 * @see {@link UserSearchService#buildSearchUserNoLoginQueries}
	 */
	@bindThis
	public async search(
		params: {
			username?: string | null,
			host?: string | null,
			activeThreshold?: Date,
		},
		opts?: {
			limit?: number,
			detail?: boolean,
		},
		me?: MiUser | null,
	): Promise<Packed<'User'>[]> {
		const queries = me ? this.buildSearchUserQueries(me, params) : this.buildSearchUserNoLoginQueries(params);

		let resultSet = new Set<MiUser['id']>();
		const limit = opts?.limit ?? 10;
		for (const query of queries) {
			const ids = await query
				.select('user.id')
				.limit(limit - resultSet.size)
				.orderBy('user.usernameLower', 'ASC')
				.getRawMany<{ user_id: MiUser['id'] }>()
				.then(res => res.map(x => x.user_id));

			resultSet = new Set([...resultSet, ...ids]);
			if (resultSet.size >= limit) {
				break;
			}
		}

		return this.userEntityService.packMany<'UserLite' | 'UserDetailed'>(
			[...resultSet].slice(0, limit),
			me,
			{ schema: opts?.detail ? 'UserDetailed' : 'UserLite' },
		);
	}

	/**
	 * ログイン済みユーザによる検索実行時のクエリ一覧を構築する.
	 * @param me
	 * @param params
	 * @private
	 */
	@bindThis
	private buildSearchUserQueries(
		me: MiUser,
		params: {
			username?: string | null,
			host?: string | null,
			activeThreshold?: Date,
		},
	) {
		// デフォルト30日以内に更新されたユーザーをアクティブユーザーとする
		const activeThreshold = params.activeThreshold ?? defaultActiveThreshold();

		const followingUserQuery = this.followingsRepository.createQueryBuilder('following')
			.select('following.followeeId')
			.where('following.followerId = :followerId', { followerId: me.id });

		const activeFollowingUsersQuery = this.generateUserQueryBuilder(params)
			.andWhere(`user.id IN (${followingUserQuery.getQuery()})`)
			.andWhere('user.updatedAt > :activeThreshold', { activeThreshold });
		activeFollowingUsersQuery.setParameters(followingUserQuery.getParameters());

		const inactiveFollowingUsersQuery = this.generateUserQueryBuilder(params)
			.andWhere(`user.id IN (${followingUserQuery.getQuery()})`)
			.andWhere(new Brackets(qb => {
				qb
					.where('user.updatedAt IS NULL')
					.orWhere('user.updatedAt <= :activeThreshold', { activeThreshold });
			}));
		inactiveFollowingUsersQuery.setParameters(followingUserQuery.getParameters());

		// 自分自身がヒットするとしたらここ
		const activeUserQuery = this.generateUserQueryBuilder(params)
			.andWhere(`user.id NOT IN (${followingUserQuery.getQuery()})`)
			.andWhere('user.updatedAt > :activeThreshold', { activeThreshold });
		activeUserQuery.setParameters(followingUserQuery.getParameters());

		const inactiveUserQuery = this.generateUserQueryBuilder(params)
			.andWhere(`user.id NOT IN (${followingUserQuery.getQuery()})`)
			.andWhere('user.updatedAt <= :activeThreshold', { activeThreshold });
		inactiveUserQuery.setParameters(followingUserQuery.getParameters());

		return [activeFollowingUsersQuery, inactiveFollowingUsersQuery, activeUserQuery, inactiveUserQuery];
	}

	/**
	 * ログインしていないユーザによる検索実行時のクエリ一覧を構築する.
	 * @param params
	 * @private
	 */
	@bindThis
	private buildSearchUserNoLoginQueries(params: {
		username?: string | null,
		host?: string | null,
		activeThreshold?: Date,
	}) {
		// デフォルト30日以内に更新されたユーザーをアクティブユーザーとする
		const activeThreshold = params.activeThreshold ?? defaultActiveThreshold();

		const activeUserQuery = this.generateUserQueryBuilder(params)
			.andWhere(new Brackets(qb => {
				qb
					.where('user.updatedAt IS NULL')
					.orWhere('user.updatedAt > :activeThreshold', { activeThreshold });
			}));

		const inactiveUserQuery = this.generateUserQueryBuilder(params)
			.andWhere('user.updatedAt <= :activeThreshold', { activeThreshold });

		return [activeUserQuery, inactiveUserQuery];
	}

	/**
	 * ユーザ検索クエリで共通する抽出条件をあらかじめ設定したクエリビルダを生成する.
	 * @param params
	 * @private
	 */
	@bindThis
	private generateUserQueryBuilder(params: {
		username?: string | null,
		host?: string | null,
	}): SelectQueryBuilder<MiUser> {
		const userQuery = this.usersRepository.createQueryBuilder('user');

		if (params.username) {
			userQuery.andWhere('user.usernameLower LIKE :username', { username: sqlLikeEscape(params.username.toLowerCase()) + '%' });
		}

		if (params.host) {
			if (params.host === this.config.hostname || params.host === '.') {
				userQuery.andWhere('user.host IS NULL');
			} else {
				userQuery.andWhere('user.host LIKE :host', {
					host: sqlLikeEscape(params.host.toLowerCase()) + '%',
				});
			}
		}

		userQuery.andWhere('user.isSuspended = FALSE');

		return userQuery;
	}
}
