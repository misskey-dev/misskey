import { EntityRepository, Repository } from 'typeorm';
import { UserGroup } from '../entities/user-group';
import { ensure } from '../../prelude/ensure';
import { UserGroupJoinings } from '..';
import { bool, types, SchemaType } from '../../misc/schema';

export type PackedUserGroup = SchemaType<typeof packedUserGroupSchema>;

@EntityRepository(UserGroup)
export class UserGroupRepository extends Repository<UserGroup> {
	public async pack(
		src: UserGroup['id'] | UserGroup,
	): Promise<PackedUserGroup> {
		const userGroup = typeof src === 'object' ? src : await this.findOne(src).then(ensure);

		const users = await UserGroupJoinings.find({
			userGroupId: userGroup.id
		});

		return {
			id: userGroup.id,
			createdAt: userGroup.createdAt.toISOString(),
			name: userGroup.name,
			userIds: users.map(x => x.userId)
		};
	}
}

export const packedUserGroupSchema = {
	type: types.object,
	optional: bool.false, nullable: bool.false,
	properties: {
		id: {
			type: types.string,
			optional: bool.false, nullable: bool.false,
			format: 'id',
			description: 'The unique identifier for this UserGroup.',
			example: 'xxxxxxxxxx',
		},
		createdAt: {
			type: types.string,
			optional: bool.false, nullable: bool.false,
			format: 'date-time',
			description: 'The date that the UserGroup was created.'
		},
		name: {
			type: types.string,
			optional: bool.false, nullable: bool.false,
			description: 'The name of the UserGroup.'
		},
		userIds: {
			type: types.array,
			nullable: bool.false, optional: bool.true,
			items: {
				type: types.string,
				nullable: bool.false, optional: bool.false,
				format: 'id',
			}
		},
	},
};
