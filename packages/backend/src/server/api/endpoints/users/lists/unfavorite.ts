/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { UserListFavoritesRepository, UserListsRepository } from '@/models/_.js';
import { ApiError } from '@/server/api/error.js';
import { DI } from '@/di-symbols.js';

export const meta = {
	requireCredential: true,
	kind: 'write:account',
	errors: {
		noSuchList: {
			message: 'No such user list.',
			code: 'NO_SUCH_USER_LIST',
			id: 'baedb33e-76b8-4b0c-86a8-9375c0a7b94b',
		},

		notFavorited: {
			message: 'You have not favorited the list.',
			code: 'ALREADY_FAVORITED',
			id: '835c4b27-463d-4cfa-969b-a9058678d465',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		listId: { type: 'string', format: 'misskey:id' },
	},
	required: ['listId'],
} as const;

@Injectable() // eslint-disable-next-line import/no-default-export
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor (
		@Inject(DI.userListsRepository)
		private userListsRepository: UserListsRepository,

		@Inject(DI.userListFavoritesRepository)
		private userListFavoritesRepository: UserListFavoritesRepository,
	) {
		super(meta, paramDef, async (ps, me) => {
			const userListExist = await this.userListsRepository.exist({
				where: {
					id: ps.listId,
					isPublic: true,
				},
			});

			if (!userListExist) {
				throw new ApiError(meta.errors.noSuchList);
			}

			const exist = await this.userListFavoritesRepository.findOneBy({
				userListId: ps.listId,
				userId: me.id,
			});

			if (exist === null) {
				throw new ApiError(meta.errors.notFavorited);
			}

			await this.userListFavoritesRepository.delete({ id: exist.id });
		});
	}
}
