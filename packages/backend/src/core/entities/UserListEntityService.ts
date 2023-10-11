/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type { MiUser, MiUserListMembership, UserListMembershipsRepository, UserListsRepository } from '@/models/_.js';
import type { Packed } from '@/misc/json-schema.js';
import type { MiUserList } from '@/models/UserList.js';
import { bindThis } from '@/decorators.js';
import { UserEntityService } from './UserEntityService.js';

@Injectable()
export class UserListEntityService {
	constructor(
		@Inject(DI.userListsRepository)
		private userListsRepository: UserListsRepository,

		@Inject(DI.userListMembershipsRepository)
		private userListMembershipsRepository: UserListMembershipsRepository,

		private userEntityService: UserEntityService,
	) {
	}

	@bindThis
	public async pack(
		src: MiUserList['id'] | MiUserList,
	): Promise<Packed<'UserList'>> {
		const userList = typeof src === 'object' ? src : await this.userListsRepository.findOneByOrFail({ id: src });

		const users = await this.userListMembershipsRepository.findBy({
			userListId: userList.id,
		});

		return {
			id: userList.id,
			createdAt: userList.createdAt.toISOString(),
			name: userList.name,
			userIds: users.map(x => x.userId),
			isPublic: userList.isPublic,
		};
	}

	@bindThis
	public async packMemberships(
		src: MiUserListMembership,
		me: { id: MiUser['id'] } | null | undefined,
	): Promise<Packed<'UserListMembership'>> {
		return {
			id: src.id,
			createdAt: src.createdAt.toISOString(),
			userId: src.userId,
			user: await this.userEntityService.pack(src.userId, me),
			withReplies: src.withReplies,
		};
	}

	@bindThis
	public async packMembershipsMany(
		memberships: MiUserListMembership[],
		me: { id: MiUser['id'] } | null | undefined,
	): Promise<Packed<'UserListMembership'>[]> {
		return (await Promise.allSettled(memberships.map(u => this.packMemberships(u, me))))
			.filter(result => result.status === 'fulfilled')
			.map(result => (result as PromiseFulfilledResult<Packed<'UserListMembership'>>).value);
	}
}

