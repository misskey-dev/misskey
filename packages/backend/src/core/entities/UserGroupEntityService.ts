import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type { UserGroupJoinings, UserGroups } from '@/models/index.js';
import { awaitAll } from '@/misc/prelude/await-all.js';
import type { Packed } from '@/misc/schema.js';
import type { } from '@/models/entities/Blocking.js';
import type { User } from '@/models/entities/User.js';
import type { UserGroup } from '@/models/entities/UserGroup.js';
import { UserEntityService } from './UserEntityService.js';

@Injectable()
export class UserGroupEntityService {
	constructor(
		@Inject(DI.userGroupsRepository)
		private userGroupsRepository: typeof UserGroups,

		@Inject(DI.userGroupJoiningsRepository)
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

