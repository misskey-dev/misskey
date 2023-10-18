/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { UserListFavoritesRepository, UserListsRepository } from '@/models/_.js';
import { IdService } from '@/core/IdService.js';
import { ApiError } from '@/server/api/error.js';
import { DI } from '@/di-symbols.js';

export const meta = {
	requireCredential: true,
	errors: {
		noSuchList: {
			message: 'No such user list.',
			code: 'NO_SUCH_USER_LIST',
			id: '7dbaf3cf-7b42-4b8f-b431-b3919e580dbe',
		},

		alreadyFavorited: {
			message: 'The list has already been favorited.',
			code: 'ALREADY_FAVORITED',
			id: '6425bba0-985b-461e-af1b-518070e72081',
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
		private idService: IdService,
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

			const exist = await this.userListFavoritesRepository.exist({
				where: {
					userId: me.id,
					userListId: ps.listId,
				},
			});

			if (exist) {
				throw new ApiError(meta.errors.alreadyFavorited);
			}

			await this.userListFavoritesRepository.insert({
				id: this.idService.gen(),
				userId: me.id,
				userListId: ps.listId,
			});
		});
	}
}
