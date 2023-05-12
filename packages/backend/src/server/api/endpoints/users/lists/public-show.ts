import { Inject, Injectable } from '@nestjs/common';
import type { UserListFavoritesRepository, UserListsRepository } from '@/models/index.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { UserListEntityService } from '@/core/entities/UserListEntityService.js';
import { DI } from '@/di-symbols.js';
import { ApiError } from '../../../error.js';

export const meta = {
	tags: ['lists', 'account'],
	requireCredential: false,
	res: {
		type: 'object',
		optional: false, nullable: false,
		ref: 'UserList',
	},
	errors: {
		noSuchList: {
			message: 'No such list.',
			code: 'NO_SUCH_LIST',
			id: 'ad13e08a-6786-4b98-9f40-741e36654dd5',
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
	constructor(
		@Inject(DI.userListsRepository)
		private userListsRepository: UserListsRepository,

		@Inject(DI.userListFavoritesRepository)
		private userListFavoritesRepository: UserListFavoritesRepository,

		private userListEntityService: UserListEntityService,
	) {
		super(meta, paramDef, async (ps, me) => { 
			let like: boolean;
			// Fetch the list
			const userList = await this.userListsRepository.findOneBy({
				id: ps.listId,
				isPublic: true,
			});

			if (userList == null) {
				throw new ApiError(meta.errors.noSuchList);
			}

			const likedCount = await this.userListFavoritesRepository.findBy({
				userListId: ps.listId,
			});

			if (me !== null) {
				like = (await this.userListFavoritesRepository.findOneBy({
					userId: me.id,
					userListId: ps.listId,
				}) !== null);
			} else {
				like = false;
			}

			return {
				...await this.userListEntityService.pack(userList),
				isLiked: like,
				likedCount: likedCount.length,
			};
		});
	}
}
