/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { In, IsNull } from 'typeorm';
import { Inject, Injectable } from '@nestjs/common';
import type { UsersRepository } from '@/models/_.js';
import type { MiUser } from '@/models/User.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { RemoteUserResolveService } from '@/core/RemoteUserResolveService.js';
import { DI } from '@/di-symbols.js';
import PerUserPvChart from '@/core/chart/charts/per-user-pv.js';
import { RoleService } from '@/core/RoleService.js';
import { ApiError } from '../../error.js';
import { ApiLoggerService } from '../../ApiLoggerService.js';
import type { FindOptionsWhere } from 'typeorm';

export const meta = {
	tags: ['users'],

	requireCredential: false,

	description: 'Show the properties of a user.',

	res: {
		optional: false, nullable: false,
		oneOf: [
			{
				type: 'object',
				ref: 'UserDetailed',
			},
			{
				type: 'array',
				items: {
					type: 'object',
					ref: 'UserDetailed',
				},
			},
		],
	},

	errors: {
		failedToResolveRemoteUser: {
			message: 'Failed to resolve remote user.',
			code: 'FAILED_TO_RESOLVE_REMOTE_USER',
			id: 'ef7b9be4-9cba-4e6f-ab41-90ed171c7d3c',
			kind: 'server',
		},

		noSuchUser: {
			message: 'No such user.',
			code: 'NO_SUCH_USER',
			id: '4362f8dc-731f-4ad8-a694-be5a88922a24',
			httpStatusCode: 404,
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		userId: { type: 'string', format: 'misskey:id' },
		userIds: { type: 'array', uniqueItems: true, items: {
			type: 'string', format: 'misskey:id',
		} },
		username: { type: 'string' },
		host: {
			type: 'string',
			nullable: true,
			description: 'The local host is represented with `null`.',
		},
	},
	anyOf: [
		{ required: ['userId'] },
		{ required: ['userIds'] },
		{ required: ['username'] },
	],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		private userEntityService: UserEntityService,
		private remoteUserResolveService: RemoteUserResolveService,
		private roleService: RoleService,
		private perUserPvChart: PerUserPvChart,
		private apiLoggerService: ApiLoggerService,
	) {
		super(meta, paramDef, async (ps, me, _1, _2, _3, ip) => {
			let user;

			const isModerator = await this.roleService.isModerator(me);
			ps.username = ps.username?.trim();

			if (ps.userIds) {
				if (ps.userIds.length === 0) {
					return [];
				}

				const users = await this.usersRepository.findBy(isModerator ? {
					id: In(ps.userIds),
				} : {
					id: In(ps.userIds),
					isSuspended: false,
				});

				// リクエストされた通りに並べ替え
				const _users: MiUser[] = [];
				for (const id of ps.userIds) {
					_users.push(users.find(x => x.id === id)!);
				}

				return await Promise.all(_users.map(u => this.userEntityService.pack(u, me, {
					schema: 'UserDetailed',
				})));
			} else {
				// Lookup user
				if (typeof ps.host === 'string' && typeof ps.username === 'string') {
					user = await this.remoteUserResolveService.resolveUser(ps.username, ps.host).catch(err => {
						this.apiLoggerService.logger.warn(`failed to resolve remote user: ${err}`);
						throw new ApiError(meta.errors.failedToResolveRemoteUser);
					});
				} else {
					const q: FindOptionsWhere<MiUser> = ps.userId != null
						? { id: ps.userId }
						: { usernameLower: ps.username!.toLowerCase(), host: IsNull() };

					user = await this.usersRepository.findOneBy(q);
				}

				if (user == null || (!isModerator && user.isSuspended)) {
					throw new ApiError(meta.errors.noSuchUser);
				}

				if (user.host == null) {
					if (me == null && ip != null) {
						this.perUserPvChart.commitByVisitor(user, ip);
					} else if (me && me.id !== user.id) {
						this.perUserPvChart.commitByUser(user, me.id);
					}
				}

				return await this.userEntityService.pack(user, me, {
					schema: 'UserDetailed',
				});
			}
		});
	}
}
