/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { In } from 'typeorm';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { ApiError } from '@/server/api/error.js';
import { DI } from '@/di-symbols.js';
import type { UserListsRepository, UserListFavoritesRepository } from '@/models/_.js';
import { UserListEntityService } from '@/core/entities/UserListEntityService.js';
import { QueryService } from '@/core/QueryService.js';
export const meta = {
	tags: ['lists', 'account'],

	requireCredential: false,

	kind: 'read:account',

	description: 'Show all lists that the authenticated user has created.',

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'object',
			optional: false, nullable: false,
			ref: 'UserList',
		},
	},
	errors: {
		noSuchUser: {
			message: 'No such user.',
			code: 'NO_SUCH_USER',
			id: 'a8af4a82-0980-4cc4-a6af-8b0ffd54465e',
		},
		remoteUser: {
			message: 'Not allowed to load the remote user\'s list',
			code: 'REMOTE_USER_NOT_ALLOWED',
			id: '53858f1b-3315-4a01-81b7-db9b48d4b79a',
		},
		invalidParam: {
			message: 'Invalid param.',
			code: 'INVALID_PARAM',
			id: 'ab36de0e-29e9-48cb-9732-d82f1281620d',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
		sinceId: { type: 'string', format: 'misskey:id' },
		untilId: { type: 'string', format: 'misskey:id' },
	},
	required: [],
} as const;

@Injectable() // eslint-disable-next-line import/no-default-export
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject(DI.userListFavoritesRepository)
		private userListFavoritesRepository: UserListFavoritesRepository,
		@Inject(DI.userListsRepository)
		private userListsRepository: UserListsRepository,
		private userListEntityService: UserListEntityService,
		private queryService: QueryService,
	) {
		super(meta, paramDef, async (ps, me) => {
			if (!me) {
				throw new ApiError(meta.errors.noSuchUser);
			}
			const favorites = await this.userListFavoritesRepository.findBy({ userId: me.id });

			if (favorites == null) {
				return [];
			}
			const listIds = favorites.map(favorite => favorite.userListId);
			const lists = await this.userListsRepository.findBy({ id: In(listIds) });
			return await Promise.all(lists.map(async list => await this.userListEntityService.pack(list)));
		});
	}
}
