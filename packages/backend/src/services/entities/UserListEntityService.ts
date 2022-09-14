import { Inject, Injectable } from '@nestjs/common';
import { DI_SYMBOLS } from '@/di-symbols.js';
import type { UserListJoinings, UserLists } from '@/models/index.js';
import { awaitAll } from '@/prelude/await-all.js';
import type { Packed } from '@/misc/schema.js';
import type { } from '@/models/entities/blocking.js';
import type { User } from '@/models/entities/user.js';
import type { UserList } from '@/models/entities/user-list.js';
import { UserEntityService } from './UserEntityService.js';

@Injectable()
export class UserListEntityService {
	constructor(
		@Inject('userListsRepository')
		private userListsRepository: typeof UserLists,

		@Inject('userListJoiningsRepository')
		private userListJoiningsRepository: typeof UserListJoinings,

		private userEntityService: UserEntityService,
	) {
	}

	public async pack(
		src: UserList['id'] | UserList,
	): Promise<Packed<'UserList'>> {
		const userList = typeof src === 'object' ? src : await this.userListsRepository.findOneByOrFail({ id: src });

		const users = await this.userListJoiningsRepository.findBy({
			userListId: userList.id,
		});

		return {
			id: userList.id,
			createdAt: userList.createdAt.toISOString(),
			name: userList.name,
			userIds: users.map(x => x.userId),
		};
	}
}

