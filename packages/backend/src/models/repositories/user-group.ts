import { db } from '@/db/postgre.js';
import { UserGroup } from '@/models/entities/user-group.js';
import { UserGroupJoinings } from '../index.js';
import { Packed } from '@/misc/schema.js';

export const UserGroupRepository = db.getRepository(UserGroup).extend({
	async pack(
		src: UserGroup['id'] | UserGroup,
	): Promise<Packed<'UserGroup'>> {
		const userGroup = typeof src === 'object' ? src : await this.findOneByOrFail({ id: src });

		const users = await UserGroupJoinings.findBy({
			userGroupId: userGroup.id,
		});

		return {
			id: userGroup.id,
			createdAt: userGroup.createdAt.toISOString(),
			name: userGroup.name,
			ownerId: userGroup.userId,
			userIds: users.map(x => x.userId),
		};
	},
});
