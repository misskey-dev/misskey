/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import * as v from 'valibot';
import * as mi from '@/misc/schema/index.js';
import type { UserListsRepository, UserListFavoritesRepository, UserListMembershipsRepository } from '@/models/_.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { UserListEntityService } from '@/core/entities/UserListEntityService.js';
import { DI } from '@/di-symbols.js';
import { QueryService } from '@/core/QueryService.js';
import { packedUserLiteSchema } from '@/models/schema/user.js';
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

	res: v.array(v.object({
		// NOTE: legacy 側は 'id' ではなく 'misskey:id' format だったため mi.idString() ではなく
		// R12 の「上記以外の res 側 format」分岐 (mi.format()) で注釈のみ維持する
		id: v.pipe(v.string(), mi.format('misskey:id')),
		createdAt: mi.dateTimeString(),
		userId: v.pipe(v.string(), mi.format('misskey:id')),
		user: packedUserLiteSchema,
		withReplies: v.boolean(),
	})),
} as const;

export const paramDef = v.object({
	listId: mi.misskeyId(),
	forPublic: v.optional(v.boolean(), false),
	...mi.paginationEntries({ max: 100, default: 30 }),
	...mi.paginationDateEntries(),
});

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

			const query = this.queryService.makePaginationQuery(this.userListMembershipsRepository.createQueryBuilder('membership'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
				.andWhere('membership.userListId = :userListId', { userListId: userList.id })
				.innerJoinAndSelect('membership.user', 'user');

			const memberships = await query
				.limit(ps.limit)
				.getMany();

			return this.userListEntityService.packMembershipsMany(memberships);
		});
	}
}
