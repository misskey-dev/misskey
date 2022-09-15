import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type { UserGroupJoinings, UserGroups } from '@/models/index.js';
import { awaitAll } from '@/prelude/await-all.js';
import type { Packed } from '@/misc/schema.js';
import type { } from '@/models/entities/blocking.js';
import type { User } from '@/models/entities/user.js';
import type { UserGroup } from '@/models/entities/user-group.js';
import { UserEntityService } from './UserEntityService.js';

@Injectable()
export class UserGroupEntityService {
	constructor(
		@Inject('userGroupsRepository')
		private userGroupsRepository: typeof UserGroups,

		@Inject('userGroupJoiningsRepository')
		private userGroupJoiningsRepository: typeof UserGroupJoinings,

		private userEntityService: UserEntityService,
	) {
	}

	public async pack(
		src: UserGroup['id'] | UserGroup,
	): Promise<Packed<'UserGroup'>> {
		const userGroup = typeof src === 'object' ? src : await this.userGroupsRepository.findOneByOrFail({ id: src });

		const users = await this.userGroupJoiningsRepository.findBy({
			userGroupId: userGroup.id,
		});

		return {
			id: userGroup.id,
			createdAt: userGroup.createdAt.toISOString(),
			name: userGroup.name,
			ownerId: userGroup.userId,
			userIds: users.map(x => x.userId),
		};
	}
}

