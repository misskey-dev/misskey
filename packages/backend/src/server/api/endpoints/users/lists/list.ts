import { Inject, Injectable } from '@nestjs/common';
import type { UserListsRepository } from '@/models/index.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { UserListEntityService } from '@/core/entities/UserListEntityService.js';
import { DI } from '@/di-symbols.js';

export const meta = {
	tags: ['lists', 'account'],

	requireCredential: true,

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
} as const;

export const paramDef = {
	type: 'object',
	properties: {},
	required: [],
} as const;

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject(DI.userListsRepository)
		private userListsRepository: UserListsRepository,

		private userListEntityService: UserListEntityService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const userLists = await this.userListsRepository.findBy({
				userId: me.id,
			});

			return await Promise.all(userLists.map(x => this.userListEntityService.pack(x)));
		});
	}
}
