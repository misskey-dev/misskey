import { Inject, Injectable } from '@/di-decorators.js';
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

@Injectable()
export class UserListService {
	public static TooManyUsersError = class extends Error {};

	constructor(
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.userListJoiningsRepository)
		private userListJoiningsRepository: UserListJoiningsRepository,

		@Inject(DI.UserEntityService)
		private userEntityService: UserEntityService,

		@Inject(DI.IdService)
		private idService: IdService,

		@Inject(DI.UserFollowingService)
		private userFollowingService: UserFollowingService,

		@Inject(DI.RoleService)
		private roleService: RoleService,

		@Inject(DI.GlobalEventService)
		private globalEventService: GlobalEventService,

		@Inject(DI.ProxyAccountService)
		private proxyAccountService: ProxyAccountService,
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
				this.userFollowingService.follow(proxy, target);
			}
		}
	}
}
