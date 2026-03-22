/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Brackets } from 'typeorm';
import { DI } from '@/di-symbols.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { ApiError } from '../../error.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { RolesRepository, RoleAssignmentsRepository, UsersRepository, NoctownPlayerScoresRepository, NoctownPlayersRepository } from '@/models/_.js';

export const meta = {
	tags: ['role', 'users'],

	requireCredential: false,

	errors: {
		noSuchRole: {
			message: 'No such role.',
			code: 'NO_SUCH_ROLE',
			id: '30aaaee3-4792-48dc-ab0d-cf501a575ac5',
		},
	},

	res: {
		type: 'array',
		items: {
			type: 'object',
			nullable: false,
			properties: {
				id: {
					type: 'string',
					format: 'misskey:id',
				},
				user: {
					type: 'object',
					ref: 'UserDetailed',
				},
				popularityScore: {
					type: 'number',
				},
			},
			required: ['id', 'user'],
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		roleId: { type: 'string', format: 'misskey:id' },
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
		offset: { type: 'integer', minimum: 0, default: 0 },
	},
	required: ['roleId'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.rolesRepository)
		private rolesRepository: RolesRepository,

		@Inject(DI.roleAssignmentsRepository)
		private roleAssignmentsRepository: RoleAssignmentsRepository,

		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.noctownPlayerScoresRepository)
		private noctownPlayerScoresRepository: NoctownPlayerScoresRepository,

		@Inject(DI.noctownPlayersRepository)
		private noctownPlayersRepository: NoctownPlayersRepository,

		private userEntityService: UserEntityService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const role = await this.rolesRepository.findOneBy({
				id: ps.roleId,
				isPublic: true,
				isExplorable: true,
			});

			if (role == null) {
				throw new ApiError(meta.errors.noSuchRole);
			}

			const query = this.roleAssignmentsRepository.createQueryBuilder('assign')
				.where('assign.roleId = :roleId', { roleId: role.id })
				.andWhere(new Brackets(qb => {
					qb
						.where('assign.expiresAt IS NULL')
						.orWhere('assign.expiresAt > :now', { now: new Date() });
				}))
				.innerJoin('assign.user', 'user');

			// 全メンバーを取得（スコア計算後にソートするため）
			const assigns = await query.getMany();

			// ロール名が「ノクタウン」の場合は専用スコアを使用
			const isNoctownRole = role.name === 'ノクタウン' || role.name === 'Noctown';

			// 新アルゴリズムで人気スコアを計算してソート
			const scoredAssigns = await Promise.all(assigns.map(async assign => {
				// ユーザー情報を取得（プライバシー設定に従った表示用）
				const user = await this.userEntityService.pack(assign.userId, me, { schema: 'UserDetailed' });

				let popularityScore: number;

				if (isNoctownRole) {
					// ノクタウンロールの場合、ノクタウンスコアを使用
					const noctownPlayer = await this.noctownPlayersRepository.findOneBy({ userId: assign.userId });
					if (noctownPlayer) {
						const noctownScore = await this.noctownPlayerScoresRepository.findOneBy({ playerId: noctownPlayer.id });
						popularityScore = noctownScore?.totalScore ?? 0;
					} else {
						popularityScore = 0;
					}
				} else {
					// 通常のロールの場合、従来のスコア計算を使用
					const userEntity = await this.usersRepository.findOneBy({ id: assign.userId });
					const actualFollowersCount = userEntity?.followersCount ?? 0;
					const actualNotesCount = userEntity?.notesCount ?? 0;

					popularityScore = await this.userEntityService.calculatePopularityScore(
						assign.userId,
						actualFollowersCount,
						actualNotesCount,
					);
				}

				return {
					id: assign.id,
					user,
					popularityScore,
				};
			}));
			
			// 人気スコアの降順にソートしてoffset/limitでスライス
			return scoredAssigns
				.sort((a, b) => b.popularityScore - a.popularityScore)
				.slice(ps.offset, ps.offset + ps.limit);
		});
	}
}
