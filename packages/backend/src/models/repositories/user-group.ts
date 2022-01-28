import { EntityRepository, Repository } from 'typeorm';
import { UserGroup } from '@/models/entities/user-group';
import { UserGroupJoinings } from '../index';
import { Packed } from '@/misc/schema';

@EntityRepository(UserGroup)
export class UserGroupRepository extends Repository<UserGroup> {
	public async pack(
		src: UserGroup['id'] | UserGroup,
	): Promise<Packed<'UserGroup'>> {
		const userGroup = typeof src === 'object' ? src : await this.findOneOrFail(src);

		const users = await UserGroupJoinings.find({
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
