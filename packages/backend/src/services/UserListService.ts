import { Inject, Injectable } from '@nestjs/common';
import type { UserListJoinings } from '@/models/index.js';
import { Users } from '@/models/index.js';
import type { User } from '@/models/entities/user.js';
import type { UserList } from '@/models/entities/user-list.js';
import type { UserListJoining } from '@/models/entities/user-list-joining.js';
import type { IdService } from '@/services/IdService.js';
import type { UserFollowingService } from '@/services/UserFollowingService.js';
import type { GlobalEventService } from '@/services/GlobalEventService.js';

@Injectable()
export class UserListService {
	constructor(
		@Inject('usersRepository')
		private usersRepository: typeof Users,

		@Inject('userListJoiningsRepository')
		private userListJoiningsRepository: typeof UserListJoinings,

		private idService: IdService,
		private userFollowingService: UserFollowingService,
		private globalEventServie: GlobalEventService,
	) {
	}

	public async push(target: User, list: UserList) {
		await this.userListJoiningsRepository.insert({
			id: this.idService.genId(),
			createdAt: new Date(),
			userId: target.id,
			userListId: list.id,
		} as UserListJoining);
	
		this.globalEventServie.publishUserListStream(list.id, 'userAdded', await this.userEntityService.pack(target));
	
		// このインスタンス内にこのリモートユーザーをフォローしているユーザーがいなくても投稿を受け取るためにダミーのユーザーがフォローしたということにする
		if (Users.isRemoteUser(target)) {
			const proxy = await fetchProxyAccount();
			if (proxy) {
				this.userFollowingService.follow(proxy, target);
			}
		}
	}
}
