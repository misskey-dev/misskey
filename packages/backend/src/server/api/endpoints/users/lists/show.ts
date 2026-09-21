/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import * as v from 'valibot';
import * as mi from '@/misc/schema/index.js';
import type { UserListsRepository, UserListFavoritesRepository } from '@/models/_.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { UserListEntityService } from '@/core/entities/UserListEntityService.js';
import { DI } from '@/di-symbols.js';
import { packedUserListSchema } from '@/models/schema/user-list.js';
import { ApiError } from '../../../error.js';

// legacy の `allOf: [{ ref: 'UserList' }, { likedCount, isLiked }]` の inline パート
const userListExtraSchema = v.object({
	likedCount: v.optional(v.number()),
	isLiked: v.optional(v.boolean()),
});

export const meta = {
	tags: ['lists', 'account'],

	requireCredential: false,

	kind: 'read:account',

	description: 'Show the properties of a list.',

	// NOTE: endpoint の res 側の allOf 合成には mi.composeEntity() (entity 登録が必須) が使えないので、
	// マージ済み object に allOfParts メタデータだけを直接載せて現行の `allOf` 出力を維持する
	res: v.pipe(
		v.object({
			...packedUserListSchema.entries,
			...userListExtraSchema.entries,
		}),
		mi.schemaMeta({ allOfParts: ['UserList', userListExtraSchema] }),
	),

	errors: {
		noSuchList: {
			message: 'No such list.',
			code: 'NO_SUCH_LIST',
			id: '7bc05c21-1d7a-41ae-88f1-66820f4dc686',
		},
	},
} as const;

export const paramDef = v.object({
	listId: mi.misskeyId(),
	forPublic: v.optional(v.boolean(), false),
});

@Injectable() // eslint-disable-next-line import/no-default-export
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject(DI.userListsRepository)
		private userListsRepository: UserListsRepository,

		@Inject(DI.userListFavoritesRepository)
		private userListFavoritesRepository: UserListFavoritesRepository,

		private userListEntityService: UserListEntityService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const additionalProperties: Partial<{ likedCount: number, isLiked: boolean }> = {};
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

			if (ps.forPublic && userList.isPublic) {
				additionalProperties.likedCount = await this.userListFavoritesRepository.countBy({
					userListId: ps.listId,
				});
				if (me !== null) {
					additionalProperties.isLiked = await this.userListFavoritesRepository.exists({
						where: {
							userId: me.id,
							userListId: ps.listId,
						},
					});
				} else {
					additionalProperties.isLiked = false;
				}
			}
			return {
				...await this.userListEntityService.pack(userList),
				...additionalProperties,
			};
		});
	}
}
