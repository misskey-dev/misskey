import { EntityRepository, Repository } from 'typeorm';
import { UserGroup } from '../entities/user-group';
import { UserGroupJoinings } from '..';
import { SchemaType } from '@/misc/schema';

export type PackedUserGroup = SchemaType<typeof packedUserGroupSchema>;

@EntityRepository(UserGroup)
export class UserGroupRepository extends Repository<UserGroup> {
	public async pack(
		src: UserGroup['id'] | UserGroup,
	): Promise<PackedUserGroup> {
		const userGroup = typeof src === 'object' ? src : await this.findOneOrFail(src);

		const users = await UserGroupJoinings.find({
			userGroupId: userGroup.id
		});

		return {
			id: userGroup.id,
			createdAt: userGroup.createdAt.toISOString(),
			name: userGroup.name,
			ownerId: userGroup.userId,
			userIds: users.map(x => x.userId)
		};
	}
}

export const packedUserGroupSchema = {
	type: 'object' as const,
	optional: false as const, nullable: false as const,
	properties: {
		id: {
			type: 'string' as const,
			optional: false as const, nullable: false as const,
			format: 'id',
			example: 'xxxxxxxxxx',
		},
		createdAt: {
			type: 'string' as const,
			optional: false as const, nullable: false as const,
			format: 'date-time',
		},
		name: {
			type: 'string' as const,
			optional: false as const, nullable: false as const,
		},
		ownerId: {
			type: 'string' as const,
			nullable: false as const, optional: false as const,
			format: 'id',
		},
		userIds: {
			type: 'array' as const,
			nullable: false as const, optional: true as const,
			items: {
				type: 'string' as const,
				nullable: false as const, optional: false as const,
				format: 'id',
			}
		},
	},
};
