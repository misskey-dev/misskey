/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import type { UserListMembershipsRepository, UserListsRepository } from '@/models/_.js';
import { IdService } from '@/core/IdService.js';
import type { MiUserList } from '@/models/UserList.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { UserListEntityService } from '@/core/entities/UserListEntityService.js';
import { DI } from '@/di-symbols.js';
import { ApiError } from '@/server/api/error.js';
import { RoleService } from '@/core/RoleService.js';

export const meta = {
	tags: ['lists'],

	requireCredential: true,
	requireRolePolicy: 'canCreateContent',

	prohibitMoved: true,

	kind: 'write:account',

	description: 'Create a new list of users.',

	res: {
		type: 'object',
		optional: false, nullable: false,
		ref: 'UserList',
	},

	errors: {
		tooManyUserLists: {
			message: 'You cannot create user list any more.',
			code: 'TOO_MANY_USERLISTS',
			id: '0cf21a28-7715-4f39-a20d-777bfdb8d138',
		},

		listUsersLimitExceeded: {
			message: 'You cannot create a list because you have exceeded the limit of users in a list.',
			code: 'LIST_USERS_LIMIT_EXCEEDED',
			id: 'af66c10d-b0e6-418c-a205-4dd46a482e30',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		name: { type: 'string', minLength: 1, maxLength: 100 },
	},
	required: ['name'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.userListsRepository)
		private userListsRepository: UserListsRepository,

		@Inject(DI.userListMembershipsRepository)
		private userListMembershipsRepository: UserListMembershipsRepository,

		private userListEntityService: UserListEntityService,
		private idService: IdService,
		private roleService: RoleService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const policies = await this.roleService.getUserPolicies(me.id);
			const currentCount = await this.userListsRepository.countBy({
				userId: me.id,
			});
			if (currentCount >= policies.userListLimit) {
				throw new ApiError(meta.errors.tooManyUserLists);
			}

			const currentUserCounts = await this.userListMembershipsRepository
				.createQueryBuilder('ulm')
				.select('COUNT(*)')
				.where('ulm.userListUserId = :userId', { userId: me.id })
				.groupBy('ulm.userListId')
				.getRawMany<{ count: number }>();
			if (currentUserCounts.some((x) => x.count > policies.userEachUserListsLimit)) {
				throw new ApiError(meta.errors.listUsersLimitExceeded);
			}

			const userList = await this.userListsRepository.insert({
				id: this.idService.gen(),
				userId: me.id,
				name: ps.name,
			} as MiUserList).then(x => this.userListsRepository.findOneByOrFail(x.identifiers[0]));

			return await this.userListEntityService.pack(userList);
		});
	}
}
