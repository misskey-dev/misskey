/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import type { UserListsRepository, UserListFavoritesRepository, UserListMembershipsRepository } from '@/models/_.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { UserListEntityService } from '@/core/entities/UserListEntityService.js';
import { DI } from '@/di-symbols.js';
import { QueryService } from '@/core/QueryService.js';
import { ApiError } from '../../../error.js';

export const meta = {
	tags: ['lists', 'account'],

	requireCredential: false,

	kind: 'read:account',

	errors: {
		noSuchList: {
			message: 'No such list.',
			code: 'NO_SUCH_LIST',
			id: '7bc05c21-1d7a-41ae-88f1-66820f4dc686',
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
				createdAt: {
					type: 'string',
					format: 'date-time',
				},
				userId: {
					type: 'string',
					format: 'misskey:id',
				},
				user: {
					type: 'object',
					ref: 'User',
				},
				withReplies: {
					type: 'boolean',
				},
			},
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		listId: { type: 'string', format: 'misskey:id' },
		forPublic: { type: 'boolean', default: false },
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 30 },
		sinceId: { type: 'string', format: 'misskey:id' },
		untilId: { type: 'string', format: 'misskey:id' },
	},
	required: ['listId'],
} as const;

@Injectable() // eslint-disable-next-line import/no-default-export
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject(DI.userListsRepository)
		private userListsRepository: UserListsRepository,

		@Inject(DI.userListMembershipsRepository)
		private userListMembershipsRepository: UserListMembershipsRepository,

		private userListEntityService: UserListEntityService,
		private queryService: QueryService,
	) {
		super(meta, paramDef, async (ps, me) => {
			// Fetch the list
			const userList = await this.userListsRepository.findOneBy(!ps.forPublic && me !== null ? {
				id: ps.listId,
				userId: me.id,
			} : {
				id: ps.listId,
				isPublic: true,
			});

			if (userList == null) {
				throw new ApiError(meta.errors.noSuchList);
			}

			const query = this.queryService.makePaginationQuery(this.userListMembershipsRepository.createQueryBuilder('membership'), ps.sinceId, ps.untilId)
				.andWhere('membership.userListId = :userListId', { userListId: userList.id })
				.innerJoinAndSelect('membership.user', 'user');

			const memberships = await query
				.limit(ps.limit)
				.getMany();

			return this.userListEntityService.packMembershipsMany(memberships);
		});
	}
}
