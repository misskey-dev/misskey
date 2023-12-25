/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import ms from 'ms';
import type { UserListsRepository, UserListMembershipsRepository, BlockingsRepository } from '@/models/_.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { GetterService } from '@/server/api/GetterService.js';
import { UserListService } from '@/core/UserListService.js';
import { DI } from '@/di-symbols.js';
import { ApiError } from '../../../error.js';

export const meta = {
	tags: ['lists', 'users'],

	requireCredential: true,

	prohibitMoved: true,

	kind: 'write:account',

	description: 'Add a user to an existing list.',

	limit: {
		duration: ms('1hour'),
		max: 30,
	},

	errors: {
		noSuchList: {
			message: 'No such list.',
			code: 'NO_SUCH_LIST',
			id: '2214501d-ac96-4049-b717-91e42272a711',
		},

		noSuchUser: {
			message: 'No such user.',
			code: 'NO_SUCH_USER',
			id: 'a89abd3d-f0bc-4cce-beb1-2f446f4f1e6a',
		},

		alreadyAdded: {
			message: 'That user has already been added to that list.',
			code: 'ALREADY_ADDED',
			id: '1de7c884-1595-49e9-857e-61f12f4d4fc5',
		},

		youHaveBeenBlocked: {
			message: 'You cannot push this user because you have been blocked by this user.',
			code: 'YOU_HAVE_BEEN_BLOCKED',
			id: '990232c5-3f9d-4d83-9f3f-ef27b6332a4b',
		},

		tooManyUsers: {
			message: 'You can not push users any more.',
			code: 'TOO_MANY_USERS',
			id: '2dd9752e-a338-413d-8eec-41814430989b',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		listId: { type: 'string', format: 'misskey:id' },
		userId: { type: 'string', format: 'misskey:id' },
	},
	required: ['listId', 'userId'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.userListsRepository)
		private userListsRepository: UserListsRepository,

		@Inject(DI.userListMembershipsRepository)
		private userListMembershipsRepository: UserListMembershipsRepository,

		@Inject(DI.blockingsRepository)
		private blockingsRepository: BlockingsRepository,

		private getterService: GetterService,
		private userListService: UserListService,
	) {
		super(meta, paramDef, async (ps, me) => {
			// Fetch the list
			const userList = await this.userListsRepository.findOneBy({
				id: ps.listId,
				userId: me.id,
			});

			if (userList == null) {
				throw new ApiError(meta.errors.noSuchList);
			}

			// Fetch the user
			const user = await this.getterService.getUser(ps.userId).catch(err => {
				if (err.id === '15348ddd-432d-49c2-8a5a-8069753becff') throw new ApiError(meta.errors.noSuchUser);
				throw err;
			});

			// Check blocking
			if (user.id !== me.id) {
				const blockExist = await this.blockingsRepository.exist({
					where: {
						blockerId: user.id,
						blockeeId: me.id,
					},
				});
				if (blockExist) {
					throw new ApiError(meta.errors.youHaveBeenBlocked);
				}
			}

			const exist = await this.userListMembershipsRepository.exist({
				where: {
					userListId: userList.id,
					userId: user.id,
				},
			});

			if (exist) {
				throw new ApiError(meta.errors.alreadyAdded);
			}

			try {
				await this.userListService.addMember(user, userList, me);
			} catch (err) {
				if (err instanceof UserListService.TooManyUsersError) {
					throw new ApiError(meta.errors.tooManyUsers);
				}

				throw err;
			}
		});
	}
}
