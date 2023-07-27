/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import type { UserListJoiningsRepository, UsersRepository } from '@/models/index.js';
import type { User } from '@/models/entities/User.js';
import type { UserList } from '@/models/entities/UserList.js';
import type { UserListJoining } from '@/models/entities/UserListJoining.js';
import { IdService } from '@/core/IdService.js';
import { UserFollowingService } from '@/core/UserFollowingService.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import { DI } from '@/di-symbols.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { ProxyAccountService } from '@/core/ProxyAccountService.js';
import { bindThis } from '@/decorators.js';
import { RoleService } from '@/core/RoleService.js';
import { QueueService } from '@/core/QueueService.js';

@Injectable()
export class UserListService {
	public static TooManyUsersError = class extends Error {};

	constructor(
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.userListJoiningsRepository)
		private userListJoiningsRepository: UserListJoiningsRepository,

		private userEntityService: UserEntityService,
		private idService: IdService,
		private userFollowingService: UserFollowingService,
		private roleService: RoleService,
		private globalEventService: GlobalEventService,
		private proxyAccountService: ProxyAccountService,
		private queueService: QueueService,
	) {
	}

	@bindThis
	public async push(target: User, list: UserList, me: User) {
		const currentCount = await this.userListJoiningsRepository.countBy({
			userListId: list.id,
		});
		if (currentCount > (await this.roleService.getUserPolicies(me.id)).userEachUserListsLimit) {
			throw new UserListService.TooManyUsersError();
		}

		await this.userListJoiningsRepository.insert({
			id: this.idService.genId(),
			createdAt: new Date(),
			userId: target.id,
			userListId: list.id,
		} as UserListJoining);

		this.globalEventService.publishUserListStream(list.id, 'userAdded', await this.userEntityService.pack(target));

		// このインスタンス内にこのリモートユーザーをフォローしているユーザーがいなくても投稿を受け取るためにダミーのユーザーがフォローしたということにする
		if (this.userEntityService.isRemoteUser(target)) {
			const proxy = await this.proxyAccountService.fetch();
			if (proxy) {
				this.queueService.createFollowJob([{ from: { id: proxy.id }, to: { id: target.id } }]);
			}
		}
	}
}
